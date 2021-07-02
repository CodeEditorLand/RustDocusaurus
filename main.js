const explore = require("./actions/explore");
const extract = require("./actions/extract");
const transform = require("./actions/transform");
const save = require("./actions/save");

const util = require("util");
const exec = util.promisify(require("child_process").exec);

const getCleanedResult = (result) => result.stdout.replace("\n", "");
const getRepositoryInfo = async (path) => {
  const repoOwnership = getCleanedResult(
    await exec("git remote get-url origin", { cwd: path })
  )
    .match(/(?:https:\/\/github.com\/|git@github\.com:)(.*).git/)[1]
    .split("/");
  return {
    revision: getCleanedResult(
      await exec("git rev-parse --short HEAD", { cwd: path })
    ),
    owner: repoOwnership[0],
    project: repoOwnership[1],
  };
};

const transformDocs = async (cratePath, originPath, targetPath) => {
  const crateName = cratePath.split("/").pop();

  const repositoryInfo = await getRepositoryInfo(cratePath);

  const docs = await explore(cratePath);
  const contents = await extract(docs);
  const results = await transform(contents, crateName, repositoryInfo);
  await save(results, originPath, targetPath, crateName);

  return results;
};

module.exports = {
  transformDocs,
};
