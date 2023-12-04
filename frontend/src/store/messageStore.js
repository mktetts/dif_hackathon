// Import zustand
import create from 'zustand';

// Create a zustand store
const messageStore = create((set) => ({
  dataArray: [],
  // Function to update the array
  updateArray: (newArray) => set({ dataArray: newArray }),
  // Function to add an item to the array
  addItem: (item) => set((state) => ({ dataArray: [...state.dataArray, item] })),

  // Function to remove an item from the array
  removeItem: (item) =>
    set((state) => ({ dataArray: state.dataArray.filter((existingItem) => existingItem !== item) })),
}));

export default messageStore;
