import RNFS from "react-native-fs";
import StaticServer from "react-native-static-server";

interface StaticServer {
  run(): Promise<string | void>;
  stop(): void;
  isRunning(): boolean;
}

const PORT = 8080;

export class LocalStaticServer implements StaticServer {
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
