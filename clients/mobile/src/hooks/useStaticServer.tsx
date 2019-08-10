import { useState } from "react";
import { LocalStaticServer } from "../lib/localStaticServer";
import {useOnMount} from "./useOnMount";

export const useLocalServer = () => {
  const [uri, setUri] = useState<string | undefined>(undefined);
  const server = new LocalStaticServer();

  useOnMount(() => {
    server
      .run()
      .then((url: string) => setUri(url))
      .catch(e => {
        throw e;
      });

    return () => server.stop();
  });

  return {
    uri,
    setUri
  };
};
