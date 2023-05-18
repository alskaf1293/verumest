export function waitload(sec: number) {
  return new Promise((resolve) => setTimeout(resolve, sec * 1000));
}


export default waitload;