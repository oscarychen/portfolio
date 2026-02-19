---
title: "Removing files from Git commit history"
description: ""
pubDate: "Sep 30 2021"
---

Clone a fresh copy of the repository using ssh and `--mirror` flag
`git clone --mirror git://example.com/some-big-repo.git`

Download the bfg.jar file from [BFG Repo-cleaner](https://rtyley.github.io/bfg-repo-cleaner/)

Run BFG on the repo:
`java -jar bfg.jar --delete-files "*.csv" some-big-repo.git`

Enter the repo and run command:

```
cd some-big-repo.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
```

Now you can try force pushing into the repository, you may encounter error if you have merged pull request in commit history, if you do, try the following:
`git for-each-ref --format 'delete %(refname)' refs/pull | git update-ref --stdin`

and then force push again:
`git push --force`
