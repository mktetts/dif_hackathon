import { MetaMaskInpageProvider } from '@metamask/providers';

declare global {
  interface Window {
    ethereum: any
  }
}

declare global {
  interface navigator {
    getUserMedia: any,
    webkitGetUserMedia : any,
    mozGetUserMedia : any
  }
}