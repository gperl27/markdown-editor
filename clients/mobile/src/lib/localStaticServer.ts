import RNFS from "react-native-fs";
import StaticServer from "react-native-static-server";
import { useEffect, useState } from "react";

interface StaticServer {
  run(): Promise<string | void>;
  stop(): void;
  isRunning(): boolean;
}

const PORT = 8080;

class LocalStaticServer implements StaticServer {
  private port = PORT;
  private path = RNFS.MainBundlePath + "/build";
  private server = new StaticServer(this.port, this.path, { localOnly: true });

  public async run(): Promise<string> {
    return this.server.start();
  }

  public stop(): void {
    this.server.stop();
  }

  public isRunning(): boolean {
    return this.server.isRunning();
  }
}

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
  }, []);

  return {
    uri,
    setUri
  };
};
