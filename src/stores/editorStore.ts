import { create } from "zustand";

interface EditorState {
  originalUri: string | null;
  imageWidth: number;
  imageHeight: number;
  editedUri: string | null;
  setOriginalImage: (uri: string, width: number, height: number) => void;
  setEditedImage: (uri: string) => void;
  clear: () => void;
}

export const useEditorStore = create<EditorState>((set) => ({
  originalUri: null,
  imageWidth: 0,
  imageHeight: 0,
  editedUri: null,
  setOriginalImage: (uri, width, height) =>
    set({
      originalUri: uri,
      imageWidth: width,
      imageHeight: height,
      editedUri: null,
    }),
  setEditedImage: (uri) => set({ editedUri: uri }),
  clear: () =>
    set({
      originalUri: null,
      imageWidth: 0,
      imageHeight: 0,
      editedUri: null,
    }),
}));
