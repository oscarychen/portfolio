---
title: "Setting up SSH for Git"
description: ""
pubDate: "Aug 15 2019"
---

## General set-up for Git/Github account

Generally from a development machine, you would want to set up a ssh key that allows you to access your entire Github account, and access all of the repos under that account, here is how you can do that.

Generate a ssh key to be used from your machine to access your entire Github account:
`ssh-keygen -t rsa -b 4096 -C "your_email@example.com"`
When prompted "Enter file in which to save the key", you can specify something like: `/Users/<username>/.ssh/github`
This should result in a private and public key pair being created:

```
/Users/<username>/.ssh/github
/Users/<username>/.ssh/github.pub
```

Next, modify or create a configuration file for ssh at `/Users/<username>/.ssh/config`, which should contain the following:

```
Host github.com
  HostName github.com
  AddKeysToAgent yes
  UseKeychain yes
  User <github username>
  IdentityFile ~/.ssh/github
```

If you did not specify a passphrase when creating the ssh key, you can remove the `UseKeyChain` setting.

Next, start ssh-agent and add the key to ssh agent:

```
eval "$(ssh-agent -s)"
ssh-add ~/.ssh/github
```

Next, navigate to Github -> Settings -> SSH and GPG Keys -> New SSH key, and copy the content of the public key from `/Users/<username>/.ssh/github.pub`

Now, you can clone the repo using ssh instead of https. Ie, instead of:
`git clone https://github.com/<username>/<repo-name>.git`
You can clone using:
`git clone git@github.com:<username>/<repo-name>.git`

If you are working with a repo previously cloned using https, you can either re-clone it, or modify the remote origin address to the ssh address:
`nano .git/config`

_SSH key also allows installation from a **private** git repo using pip, ie:_
`pip install git+ssh://git@github.com/oscarychen/my_repo.git`

_If you used a password phrase when creating the ssh key pair, you may need to add the key to the ssh key agent everytime you start up a new bash instance. You may want to automate this by adding the following inside `.bash_profile` or `.bashrc`:_

```
if [ -z "$SSH_AUTH_SOCK" ] ; then
  eval `ssh-agent -s`
  ssh-add ~/.ssh/github
fi
```

## Repo-specific deployment key set up

Sometimes from a virtual machine where you are deploying a web app, you would only want this machine to have access to specific project repositories. Here is how you can set them up with deployment keys to specific repos.

Same as the example above, but let's generate the key pair at a different path:

```
/Users/<username>/.ssh/my_web_app
/Users/<username>/.ssh/my_web_app.pub
```

Next, modify or create a configuration file for ssh at `/Users/<username>/.ssh/config`, which should contain the following:

```
Host github.com-my-web-app
  HostName github.com
  User <github username>
  IdentityFile ~/.ssh/my_web_app
```

Next, add deployment key to your Github repository: Repo Settings -> Deploy Keys -> Add deploy key, copy and paste the content of the public key from `/Users/<username>/.ssh/my_web_app.pub`

When cloning the repo, use the ssh repo cloning link but specifying the host as named exactly in the ssh config, for example:
`git clone git@github.com-my-web-app:oscarychen/my_web_app.git`

Now you can repeat the same process for another deployment repo, the ssh config would look like the following for two different repos:

```
Host github.com-my-web-app
  HostName github.com
  User <github username>
  IdentityFile ~/.ssh/my_web_app

Host github.com-my-web-app-2
  HostName github.com
  User <github username>
  IdentityFile ~/.ssh/my_web_app_2
```

sometimes you have to update the config file permission:
`chomod 600 ~/.ssh/config`

## Creating signed commits

Download and install GPG Suite (Mac OS): https://gpgtools.org
or Gpg4win (Windows): https://www.gpg4win.org

Create a Secrete/Public key pair.
Copy the public key and paste to Github: Settings -> SSH and GPG keys -> New GPG key

Configure Git to use your GPG key:

```
gpg --list-secret-keys --keyid-format LONG
```

and you shoud see the key id printed after `rsa2048/`:

`sec rsa2048/`<b>_7FFFC09ACAC05FD0_</b> `2017-06-02 [SC] [expires: 2019-06-02]`
Run this command with the GPG key from previous step:

```
git config --global user.signingkey 7FFFC09ACAC05FD0
```

Now when making a commit, you can add a `-S` flag to indicate to git to sign the commit, ie:

```
git commit -S -m"commit message"
```

To automatically sign commits when they are made (omitting the `-S` flag), in the git repository:

```
git config commit.gpgsign true
```
