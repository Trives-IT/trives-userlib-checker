import { App, MendixPlatformClient, OnlineWorkingCopy, RepositoryType, setPlatformConfig } from "mendixplatformsdk";
import * as fs from "fs";
import { IModel } from "mendixmodelsdk";

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

  const libraryNames: string[] = JSON.parse(JSON.stringify(libnames)); // Load the list of library names from the config file

  // Step 1: Get all the files in the project that are .jar files and are in the userlib folder
  const files = (await mxModel.getFiles()).filter((file) => file.endsWith(".jar")).filter((file) => file.includes("userlib"));

  // Step 2: Loop through the list of library names and count how many times each library name is found in the list of files. Output to a map.
  const libraryCountMap = new Map<string, number>(); // Prepare a map to store the result counts
  for (const word of libraryNames) {
    let count = 0;
    for (const fileName of files) {
      if (fileName.includes(word)) {
        count++;
      }
    }
    libraryCountMap.set(word, count);
  }

  // Step 3: Filter the libraryCountMap to only include libraries that are found more than once
  const filteredResults = new Map<string, number>();
  libraryCountMap.forEach((count, word) => {
    if (count > 1) {
      filteredResults.set(word, count);
    }
  });

  // Step 4: Get the files that match the filteredResults
  const outputFiles: string[][] = [];
  for (const filteredResult of filteredResults) {
    const file = (await mxModel.getFiles()).filter((file) => file.endsWith(".jar")).filter((file) => file.includes(filteredResult[0]));
    outputFiles.push(file);
  }

  // Step 5: Write the output to a JSON file
  fs.rmSync("output/output.json", { recursive: true, force: true });
  fs.writeFileSync("output/output.json", JSON.stringify(outputFiles));
}

async function createNewApp(name: string, templateId?: string, repositoryType: RepositoryType = "git"): Promise<App> {
  const newApp = await mxClient.createNewApp(name, { templateId: templateId, repositoryType: repositoryType });
  return newApp;
}

function getExistingApp(projectId: string): App {
  return mxClient.getApp(projectId);
}
