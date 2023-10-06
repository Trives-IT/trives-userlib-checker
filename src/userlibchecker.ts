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
      const fileName = file.split("/")[1]; // Get the filename after the userlib folder
      const filenameParts = fileName.split(".jar")[0].split("-"); // Remove the .jar extension and split the filename on the - character
      // prettier-ignore
      // Prettier-ignore is needed here since it otherwise messes up the regex if you have it installed...
      const versionRegex = new RegExp("^[0-9]+(\.[0-9]+)+"); //The regex covers all versions that are in the format x.x, x.x.x etc.
      const version = filenameParts.find((snippet) => versionRegex.test(snippet))!; // Find the first part of the filename that matches the regex. This should be the version
      const libName = fileName.substring(0, fileName.indexOf(version) - 1); // Get the root library name by removing the version from the filename
      const libraryVersion = { libraryVersion: version, fullFileName: fileName }; // Create a library version object
      const library = getLibrary(libraryList, libName); // Get the library object from the library list. The function will create a new library if it doesn't exist yet in the list
      library.libraryVersions.push(libraryVersion); // Add the library version to the library object
    } catch {
      console.warn("Failed to get library name and version for file: " + file + ". It does not adhere to the usual naming convention."); // If the file does not adhere to the naming convention, log it
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
  libraryVersions: LibraryVersion[];
}

interface LibraryVersion {
  libraryVersion: string;
  fullFileName: string;
}
