import { App, MendixPlatformClient, OnlineWorkingCopy, RepositoryType, setPlatformConfig } from "mendixplatformsdk";
import * as fs from "fs";
import { IModel } from "mendixmodelsdk";
import * as path from "path";

const config = require("../config/config.json");
const libnames = require("../config/libnames.json");

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

  // Step 2: Create a list of libraries with their versions
  let libraryList: Library[] = [];

  // Step 3: Loop through the list of files and get the library name and version for each file
  for (const file of files) {
    const fileName = file.split("/")[1];
    let libName: string = "";
    let version: string = "";
    let libraryVersion: LibraryVersion = { libraryVersion: "", fullFileName: "" };

    try {
      const filenameParts = fileName.split(".jar")[0].split("-");
      // prettier-ignore
      const versionRegex = new RegExp("^[0-9]+(\.[0-9]+)+"); // Prettier-ignore is needed here since it otherwise messes up the regex
      version = filenameParts.find((snippet) => versionRegex.test(snippet))!;
      libName = fileName.substring(0, fileName.indexOf(version) - 1);
      libraryVersion = { libraryVersion: version, fullFileName: fileName };
      const library = getLibrary(libraryList, libName);
      library.libraryVersions.push(libraryVersion);
    } catch {
      console.log("Failed to get library name and version for file: " + file);
    }
  }

  fs.writeFileSync("output/outputnew.json", JSON.stringify(libraryList.sort((a, b) => a.libraryName.localeCompare(b.libraryName))));
  fs.rmSync("_temp", { recursive: true, force: true });
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
