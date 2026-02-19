---
title: "Setting up Python, XGBoost, Scipy on M1 Mac"
description: "A guide to setting up Python, XGBoost, and Scipy on M1 Macs using Rosetta"
pubDate: "Jul 23 2021"
---

As of July 2021, installing Python Xgboost on the M1 Macs is still confusing. The Python Xgboost library relies on Scipy, which requires a Fortran compiler, which is not available because GCC is not yet available for M1 (while Scipy does not support Flang). You may succeed in installing Python xgboost library without doing what I have described below and yet encounter issue running the library. I find the easiest thing currently is to just run Terminal with Rosetta, and go from there...

## Get Terminal to run in Rosetta emulated X86 mode

- Navigate to the Terminal app in Applications folder (sometimes it might be in Applications/Utilities)
- Right click on the `Terminal` app -> Get Info -> Check `Open using Rosetta`
- Optionally, you can duplicate the Terminal app, and rename the new one to something different, such as `Terminal Rosetta` and only make the duplicated app run in Rosetta mode

## Install brew:

If you have a previous installation of brew, you can uninstall by:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/uninstall.sh)"
```

With the `Terminal` app running in Rosetta mode:

```
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

This will install brew, and since we are in Rosetta mode, you should see brew being installed under /usr/ directory. If it is being installed under /opt/ direcotry, it means you are installing a version of brew that's natively compiled for M1 chip, which is not what we want here.

## Install some packages

```
brew install postgresql miniforge cmake libomp git-lfs
git lfs install
```

## Initialize terminal shell

```
conda init zsh
```

Open a new Terminal window and start installing the rest.
