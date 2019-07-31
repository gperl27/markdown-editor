import { useEffect, useState } from "react";
import { LocalStaticServer } from "../lib/localStaticServer";

export const useLocalServer = () => {
  const [uri, setUri] = useState<string | undefined>(undefined);
  const server = new LocalStaticServer();

  useEffect(() => {
    server
      .run()
      .then((url: string) => setUri(url))
      .catch(e => {
        throw e;
      });

    return () => server.stop();
  }, [server]);

  return {
    uri,
    setUri
  };
};
