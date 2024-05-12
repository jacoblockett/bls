# Better LS

Just a simple command-line function written with Node.js to make ls'in a little bit prettier. You'll want to have Node.js and NPM installed on your machine to use this command. If you don't have them, [go here](https://nodejs.org/en/download).

Once you're setup is ready, use the following command:

```bash
npm i -g better-ls
```

Here's the gist of what you can do:

```txt
Usage: bls [options] [directory] [depth]

Arguments:
  directory      the directory to list out (default = cwd)
  depth          how deep to list          (default = 1)

Options:
  -v, --version  output the version number
  -s, --size     boolean flag to calculate the size of each file/directory
  -h, --help     display help for command
```

The arguments directory and depth will always be read left to right. If you provide a number as the first argument, `bls` will first determine if it leads to a directory. If that fails, it will assume its a depth argument. The directory argument can also be relative or absolute.

> ⚠️ Using the size flag will give you sizes of each directory and file, but beware, it's a heavy process when your requested directory has a lot of files to calculate. If used, your request may hang for a couple of seconds. Grab a snack or something, idk.