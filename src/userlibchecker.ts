import { App, MendixPlatformClient, RepositoryType, setPlatformConfig } from "mendixplatformsdk";
import * as fs from "fs";

const config = require("../config/config.json");
let mxClient: MendixPlatformClient;

main().catch(console.error);

async function main() {
  // Set up your Mendix Model SDK client:
  setPlatformConfig({ mendixToken: config.mendixtoken });
  mxClient = new MendixPlatformClient();
  const mxApp = getExistingApp(config.projectid);
  const mxWorkingCopy = await mxApp.createTemporaryWorkingCopy(config.branch);
  const mxModel = await mxWorkingCopy.openModel();

  // Step 1: Get all the files in the project that are .jar files and are in the userlib folder
  const files = (await mxModel.getFiles()).filter((file) => file.endsWith(".jar")).filter((file) => file.includes("userlib"));

  // Step 2: Create an empty list of library collections
  let libraryList: Library[] = [];

  // Step 3: Loop through the list of files and get the library name and version for each file. If both are found, add it to the library list
  for (const file of files) {
    try {
      const fileNameProper = file.split("/")[1]; // Get the filename after the userlib folder
      // prettier-ignore
      const versionRegex = new RegExp("^[0-9]+(\.[0-9]+)+"); // The regex covers all versions that are in the format x.x, x.x.x etc.
      const version = fileNameProper
        .split(".jar")[0] // Remove the .jar extension
        .split("-") // Split the filename on the - character
        .find((snippet) => versionRegex.test(snippet))!; // Find the part that matches the regex for the version
      const baseLibraryName = fileNameProper.substring(0, fileNameProper.indexOf(version) - 1); // Get the base library name without the version
      const libraryVersion = { libraryVersion: version, fullFileName: fileNameProper }; // Create a library version
      const library = getLibrary(libraryList, baseLibraryName); // Get the library object from the library list or add new one if it doesn't exist
      library.libraryVersions.push(libraryVersion); // Add the library version to the library object
    } catch {
      console.warn("Failed to get library name and version for file: " + file + ". It does not adhere to the usual naming convention.");
    }
  }

  fs.writeFileSync("output/output.json", JSON.stringify(libraryList.sort((a, b) => a.libraryName.localeCompare(b.libraryName)).filter((library) => library.libraryVersions.length > 1)));
  // Write the library list (with more than 1 version & sorted on alphabet by library name) to a json file
  console.log("Done! Java library list succesfully written to output/output.json");
}

async function createNewApp(name: string, templateId?: string, repositoryType: RepositoryType = "git"): Promise<App> {
  const newApp = await mxClient.createNewApp(name, { templateId: templateId, repositoryType: repositoryType });
  return newApp;
}

function getExistingApp(projectId: string): App {
  return mxClient.getApp(projectId);
}

function getLibrary(libraryList: Library[], libraryName: string): Library {
  const library = libraryList.find((library) => library.libraryName === libraryName);

  if (library) {
    return library;
  } else {
    const library: Library = { libraryName: libraryName, libraryVersions: [] };
    libraryList.push(library);
    return library;
  }
}

interface Library {
  libraryName: string;
  libraryVersions: { libraryVersion: string; fullFileName: string }[];
}
