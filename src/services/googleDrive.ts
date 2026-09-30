import { PlayerProfile, Quest } from '../types/hunter';

export const DRIVE_FOLDER_NAME = 'Solo Leveling - Hunter System';
export const DRIVE_FILE_NAME = 'hunter_save.json';

export interface HunterDriveSaveData {
  app: 'solo_leveling_system';
  version: string;
  savedAt: string;
  player: PlayerProfile;
  quests: Quest[];
  metadata?: {
    hunterName: string;
    level: number;
    rank: string;
    completedQuestsCount: number;
    stats: { fisico: number; mental: number; espiritual: number };
  };
}

export interface DriveFileInfo {
  id: string;
  name: string;
  modifiedTime?: string;
  size?: string;
  createdTime?: string;
}

/**
 * Procura pela pasta dedicada no Google Drive raiz. Se não existir, cria-a.
 */
export async function getOrCreateDriveFolder(accessToken: string): Promise<string> {
  const query = `mimeType = 'application/vnd.google-apps.folder' and name = '${DRIVE_FOLDER_NAME}' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name)&spaces=drive`;

  const searchRes = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!searchRes.ok) {
    const errorBody = await searchRes.text();
    throw new Error(`Erro ao buscar pasta no Drive (${searchRes.status}): ${errorBody}`);
  }

  const searchData = await searchRes.json();
  if (searchData.files && searchData.files.length > 0) {
    return searchData.files[0].id;
  }

  // Se não encontrou, cria a pasta
  const createRes = await fetch('https://www.googleapis.com/drive/v3/files', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name: DRIVE_FOLDER_NAME,
      mimeType: 'application/vnd.google-apps.folder',
    }),
  });

  if (!createRes.ok) {
    const errorBody = await createRes.text();
    throw new Error(`Erro ao criar pasta no Drive (${createRes.status}): ${errorBody}`);
  }

  const createData = await createRes.json();
  return createData.id;
}

/**
 * Procura pelo arquivo de save 'hunter_save.json' dentro da pasta dedicada.
 */
export async function findDriveBackupFile(accessToken: string, folderId: string): Promise<DriveFileInfo | null> {
  const query = `'${folderId}' in parents and name = '${DRIVE_FILE_NAME}' and trashed = false`;
  const url = `https://www.googleapis.com/drive/v3/files?q=${encodeURIComponent(query)}&fields=files(id,name,modifiedTime,size,createdTime)&spaces=drive`;

  const res = await fetch(url, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!res.ok) {
    const errorBody = await res.text();
    throw new Error(`Erro ao buscar arquivo no Drive (${res.status}): ${errorBody}`);
  }

  const data = await res.json();
  if (data.files && data.files.length > 0) {
    return data.files[0];
  }

  return null;
}

/**
 * Salva os dados no Google Drive:
 * - Se o arquivo hunter_save.json já existir: substitui o conteúdo in-place via PATCH (sem duplicar!)
 * - Se não existir: cria o arquivo via upload multipart na pasta dedicada
 */
export async function saveToGoogleDrive(
  accessToken: string,
  player: PlayerProfile,
  quests: Quest[]
): Promise<{ fileId: string; modifiedTime: string; size: number }> {
  // 1. Garante que a pasta existe
  const folderId = await getOrCreateDriveFolder(accessToken);

  // 2. Prepara o conteúdo JSON do save
  const saveData: HunterDriveSaveData = {
    app: 'solo_leveling_system',
    version: '1.0.0',
    savedAt: new Date().toISOString(),
    player,
    quests,
    metadata: {
      hunterName: player.name,
      level: player.level,
      rank: player.hunterRank,
      completedQuestsCount: quests.filter((q) => q.isCompleted).length,
      stats: { ...player.stats },
    },
  };

  const jsonContent = JSON.stringify(saveData, null, 2);
  const jsonBlob = new Blob([jsonContent], { type: 'application/json' });

  // 3. Verifica se o arquivo já existe na pasta
  const existingFile = await findDriveBackupFile(accessToken, folderId);

  if (existingFile) {
    // Atualização direta do conteúdo (PATCH) - Subistuição limpa sem gerar duplicatas
    const updateUrl = `https://www.googleapis.com/upload/drive/v3/files/${existingFile.id}?uploadType=media`;
    const updateRes = await fetch(updateUrl, {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: jsonContent,
    });

    if (!updateRes.ok) {
      const errText = await updateRes.text();
      throw new Error(`Falha ao atualizar backup no Drive (${updateRes.status}): ${errText}`);
    }

    const updatedData = await updateRes.json();
    return {
      fileId: existingFile.id,
      modifiedTime: updatedData.modifiedTime || new Date().toISOString(),
      size: jsonBlob.size,
    };
  } else {
    // Criação inicial com multipart upload
    const boundary = '-------314159265358979323846';
    const delimiter = `\r\n--${boundary}\r\n`;
    const closeDelimiter = `\r\n--${boundary}--`;

    const metadata = {
      name: DRIVE_FILE_NAME,
      parents: [folderId],
      mimeType: 'application/json',
      description: 'Solo Leveling Hunter System - Save Game Principal',
    };

    const multipartRequestBody =
      delimiter +
      'Content-Type: application/json; charset=UTF-8\r\n\r\n' +
      JSON.stringify(metadata) +
      delimiter +
      'Content-Type: application/json\r\n\r\n' +
      jsonContent +
      closeDelimiter;

    const createUrl = 'https://www.googleapis.com/upload/drive/v3/files?uploadType=multipart';
    const createRes = await fetch(createUrl, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'Content-Type': `multipart/related; boundary=${boundary}`,
      },
      body: multipartRequestBody,
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Falha ao criar arquivo no Drive (${createRes.status}): ${errText}`);
    }

    const createdData = await createRes.json();
    return {
      fileId: createdData.id,
      modifiedTime: createdData.modifiedTime || new Date().toISOString(),
      size: jsonBlob.size,
    };
  }
}

/**
 * Lê e carrega o arquivo de backup do Google Drive
 */
export async function loadFromGoogleDrive(
  accessToken: string
): Promise<{ data: HunterDriveSaveData; fileInfo: DriveFileInfo }> {
  // 1. Localiza a pasta
  const folderId = await getOrCreateDriveFolder(accessToken);

  // 2. Localiza o arquivo
  const fileInfo = await findDriveBackupFile(accessToken, folderId);
  if (!fileInfo) {
    throw new Error(
      `Nenhum arquivo '${DRIVE_FILE_NAME}' encontrado na pasta '${DRIVE_FOLDER_NAME}' do Google Drive.`
    );
  }

  // 3. Baixa o conteúdo do arquivo
  const downloadUrl = `https://www.googleapis.com/drive/v3/files/${fileInfo.id}?alt=media`;
  const downloadRes = await fetch(downloadUrl, {
    headers: {
      Authorization: `Bearer ${accessToken}`,
    },
  });

  if (!downloadRes.ok) {
    const errText = await downloadRes.text();
    throw new Error(`Falha ao baixar backup do Drive (${downloadRes.status}): ${errText}`);
  }

  const rawJson = await downloadRes.text();
  const parsed = JSON.parse(rawJson);

  if (!parsed || !parsed.player || !Array.isArray(parsed.quests)) {
    throw new Error('O arquivo no Google Drive não contém a estrutura válida de dados do Caçador.');
  }

  return {
    data: parsed as HunterDriveSaveData,
    fileInfo,
  };
}

/**
 * Obtém informações do backup atual sem baixar o conteúdo completo
 */
export async function getDriveBackupMetadata(
  accessToken: string
): Promise<{ exists: boolean; fileInfo: DriveFileInfo | null; folderId: string | null }> {
  try {
    const folderId = await getOrCreateDriveFolder(accessToken);
    const fileInfo = await findDriveBackupFile(accessToken, folderId);
    return {
      exists: Boolean(fileInfo),
      fileInfo,
      folderId,
    };
  } catch (err) {
    console.warn('Erro ao checar metadados do Drive:', err);
    return {
      exists: false,
      fileInfo: null,
      folderId: null,
    };
  }
}

export function formatBytes(bytes?: string | number): string {
  if (!bytes) return '0 B';
  const num = typeof bytes === 'string' ? parseInt(bytes, 10) : bytes;
  if (isNaN(num)) return '0 B';
  if (num < 1024) return `${num} B`;
  if (num < 1024 * 1024) return `${(num / 1024).toFixed(1)} KB`;
  return `${(num / (1024 * 1024)).toFixed(2)} MB`;
}

export function formatDriveTimestamp(isoDateString?: string): string {
  if (!isoDateString) return 'Data desconhecida';
  try {
    const d = new Date(isoDateString);
    if (isNaN(d.getTime())) return isoDateString;
    return d.toLocaleString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  } catch {
    return isoDateString;
  }
}
