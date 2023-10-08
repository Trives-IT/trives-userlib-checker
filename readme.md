Trives Userlib Checker:

This tool analyzes the userlib folder of your product to see whether it contains multiple versions of the same Java user library based on their file names. If multiple versions are found in your project, these will be written to a file named output.json in the output folder.

The current version supports Mendix projects up until 10.3.0.

---

Setup:

1. If you don't have npm or Typescript installed yet, follow the instructions described in section 3 of https://docs.mendix.com/apidocs-mxsdk/mxsdk/setting-up-your-development-environment/#setting. You can ignore the steps before and after.
2. Download this project
3. In config/config.json:
   - Replace {YourProjectIdHere} with the ID of the project you want to use. You can find it in Sprintr under General > Settings.
   - Replace {YourMendixTokenHere} with one you have generated (or create at https://user-settings.mendix.com/link/developersettings)
   - Set the branch that you want to use. The main line for GIT-projects is 'main', for SVN-projects this is 'trunk'.
4. (Optional) Replace the branch name if you don't want to use the main branch of your project
5. From your terminal within the project directory, run the command 'npm i'. This will install all the necessary node modules.

---

Instructions:

This project gives a simple example of how to check the userlibs in your Mendix project for duplicates using the Mendix SDK.
You can use the following npm-commands:

- npm run build: compile (actually: transpile) your TypeScript to JavaScript
- npm run script: execute the JavaScript file index.js that you created using 'build'
- npm run buildandrun: transpile your TS to JS and immediately execute

---

Useful resources:

- All SDK documentation and tutorials by Mendix: https://docs.mendix.com/apidocs-mxsdk/mxsdk/
- Our starter project for working with the Mendix sdk upon which this example was built: https://github.com/Trives-IT/trives-mendixsdk-starter
- Setting up a Mendix private access token (PAT): https://docs.mendix.com/apidocs-mxsdk/mxsdk/set-up-your-pat/
- Regexr, a handy tool to experiment with and test regular expressions: https://regexr.com/
