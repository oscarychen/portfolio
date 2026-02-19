---
title: "Setting up Gitbash, Terminal on Windows"
description: ""
pubDate: "Jul 16 2020"
---

## Using Python from Anaconda:

- Download and install Anaconda. Highly recommended to install Anaconda for current user instead of all users.
- Create or modify your .bashrc file, at a location like:

```shell
C:\Users\oscar\.bashrc
```

- Add a line that points to the path of Anaconda script, like the following:

```shell
. /c/Users/oscar/anaconda3/etc/profile.d/conda.sh
```

- You may also want to add the following lines:

```shell
alias python3='python'
conda activate
```

### If you encounter the following error when running Django command `createsuperuser`:

`Superuser creation skipped due to not running in a TTY. You can run manage.py createsuperuser in your project to create one manually.`
You may want to add the following line to `C:\Users\oscar\.profile`:

```
alias python='winpty python'
```

## Using Python from Microsoft Store:

Add the following lines to bashrc instead:

```shell
alias python='winpty python.exe'
alias pip='winpty python.exe -m pip'
```

## Adding Gitbash to Windows Terminal:

- Click on the down arrow button and go to Settings
- Add new
- In the Command line path, set it to something like the following depending on your Git installation location:
  `C:\Program Files\Git\bin\sh.exe`
