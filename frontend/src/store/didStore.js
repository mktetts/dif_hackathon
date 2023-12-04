// Import zustand
import create from 'zustand';

// Create a zustand store for a string
const didStore = create((set) => ({
  personDID: 'initialValue',

  // Function to update the string
  updateString: (newValue) => set({ personDID: newValue }),
}));

export default didStore;
