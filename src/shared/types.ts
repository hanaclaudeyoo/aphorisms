export interface AphorismEntry {
  id: string;
  text: string;
  entryDate: string;
  createdAt: string;
  tagIds: string[];
}

export interface CreateEntryInput {
  text: string;
  entryDate: string;
  tagIds: string[];
}

export interface AphorismTag {
  id: string;
  name: string;
  groupId: string;
  colorHex: string | null;
}

export interface CreateTagInput {
  name: string;
  colorHex: string;
  groupName: string;
}

export interface AphorismTagGroup {
  id: string;
  name: string;
}
