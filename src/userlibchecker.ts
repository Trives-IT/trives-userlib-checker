import { MendixPlatformClient, setPlatformConfig } from "mendixplatformsdk";
import * as fs from "fs";

const config = require("../config/config.json");
let mxClient: MendixPlatformClient;

main().catch(console.error);

async function main() {

  // Step 1: Set up your Mendix Model SDK client and open your project:
  setPlatformConfig({ mendixToken: config.mendixtoken });
  mxClient = new MendixPlatformClient();
  const mxApp = mxClient.getApp(config.projectid);
  const mxWorkingCopy = await mxApp.createTemporaryWorkingCopy(config.branch);
  const mxModel = await mxWorkingCopy.openModel();

  // Step 2: Get all the files that are .jar files and in userlib folder
  const jarFiles = (await mxModel.getFiles())
    .filter((file) => file.endsWith(".jar"))
    .filter((file) => file.startsWith("userlib"));

  // Step 3: For each file, get the library name and version. If both are found, add it to the library list
  let libraryList: {
    libraryName: string;
    libraryVersions: { libraryVersion: string; fullFileName: string }[];
  }[] = [];

  for (const file of jarFiles) {
    try {
      const fileNameProper = file.split("/")[1];
      // prettier-ignore
      const version = fileNameProper 
        .split(".jar")[0] 
        .split("-") 
        .find((snippet) => new RegExp("^[0-9]+(\.[0-9]+)+").test(snippet))!;
      const baseLibraryName = fileNameProper.substring(0, fileNameProper.indexOf(version) - 1);
      const libraryVersion = { libraryVersion: version, fullFileName: fileNameProper };
      let library = libraryList.find((library) => library.libraryName === baseLibraryName);
      if(!library) {
        library = {libraryName: baseLibraryName, libraryVersions: []}
        libraryList.push(library);  
      }
      library.libraryVersions.push(libraryVersion);
    } catch {
      console.warn("Failed to get library name and version for file: " + file);
    }
  }

  // Step 4: Write the library list to a json file if it contains more than 1 version
  fs.writeFileSync(
    "output/output.json",
    JSON.stringify(
      libraryList
        .filter((library) => library.libraryVersions.length > 1)
        .sort((a, b) => a.libraryName.localeCompare(b.libraryName))
    )
  );

  console.log("Done! Java library list succesfully written to output/output.json");
}
