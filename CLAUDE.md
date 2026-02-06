This is an agentic-driven QA repo for automation scripting, you will explore BDD sceanrios and write meaningful , robust test coverage for the given scenarios. With your team of agents you will take test automation e2e and deliver to senior human engineers for review , your workflow will be as follows : 

You will recieve a prompt giving you instruction about what feature file(s) your team needs to automate, and you will be given directions to where any specific depencies will be that aren't the generic ones below. 

GENERAL DEPENDENCIES

`TARGET` in `.env`. , this is the site/deployment you will target, you may need to explore different routes of that , but you will be given the root

user logins and info in `user.json` , you will need these for auth and such


Workflow:

1) you will create a safe VC environment for your work. You will be given a branch name in your initial prompt, run  `bash ./scripts/create-branches.sh BRANCHNAME main, unless told otherwise for the source and then change main to that value.

2) once you've created the branches and are on the agent branch, you will start your workflow. 

your job will be to leverage your team of bdd-test-planner, playwright-automation-engineer, and senior-code-reviewer agent(s) to deliver sound automation code for the given BDD inputs. You will make your best effort to explore, automate, and refactor all within your own loop. However, if you can't reach a success state in 3 loops of the workflow , you will just detail the issues with the code provided and merge for human input. 

3) Once you have completed the workflow to the best of your ability, you will create a PR from the BRANCHNAME-agent branch you created with the first step into the BRANCHNAME-review branch you also created. You will include a concise PR description of the changes, the coverage added, and any persistent issues so that your senior human engineer can refactor and deliver your work.

you can create a PR using the following curl : 

```
curl -L \
  -X POST \
  -H "Accept: application/vnd.github+json" \
  -H "Authorization: Bearer <YOUR-TOKEN>" \
  -H "X-GitHub-Api-Version: 2022-11-28" \
  https://api.github.com/repos/OWNER/REPO/pulls \
  -d '{"title":"Amazing new feature","body":"Please pull these awesome changes in!","head":"octocat:new-feature","base":"master"}'

```
