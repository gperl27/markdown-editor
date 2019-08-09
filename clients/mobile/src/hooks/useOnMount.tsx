import { useEffect } from "react";

export const useOnMount = <T extends (...args: any[]) => any>(callback: T) => {
  useEffect(() => {
    Promise.resolve(callback()).catch(e => console.log(e));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
};
