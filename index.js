#!/usr/bin/env node

import fs from "node:fs/promises"
import path from "node:path"
import { program } from "commander"
import chalk from "chalk"
import build from "./utils/buildStructure.js"
import isValidDirectory from "./utils/isValidDirectory.js"
import exit from "./utils/exit.js"

program
	.name("bls")
	.version("0.0.1")
	.description("A replacement to the built-in ls command.")
	.argument("[directory]", `The directory to list out. (default = ${process.cwd()})`)
	.argument("[depth]", "How deep to list.          (default = 1)")
	.option("-s, --size", "Boolean flag to calculate the size of each file/directory.")
	.action(async (directory, depth, options) => {
		if (directory === undefined && depth === undefined) {
			// Set defaults if both arguments are undefined
			directory = path.resolve()
			depth = 1
		} else if (directory !== undefined && depth === undefined) {
			// Validate and resolve directory if directory arg is passed, and depth is undefined
			const valid = await isValidDirectory(directory)

			if (!valid && /^\d+$/.test(directory)) {
				// Given argument should be the depth value, set accordingly
				depth = +directory
				directory = path.resolve()
			} else if (!valid) {
				// Given argument was assumed to be a directory but it didn't exist
				exit(`'${path.resolve(directory)}' is not a directory`, "Error")
			} else {
				// Given argument was assumed to be a directory and it exists
				directory = path.resolve(directory)
				depth = 1
			}
		} else if (directory !== undefined && depth !== undefined) {
			// If both values are given, validate directory exists and depth is a number
			const valid = await isValidDirectory(directory)

			if (!valid) exit(`'${path.resolve(directory)}' is not a directory`, "Error")
			if (!/^\d+$/.test(depth)) exit(`'${depth}' is not a number`, "TypeError")

			directory = path.resolve(directory)
			depth = +depth
		}

		const structure = await build(directory, {
			maxDepth: +depth,
			calculateSize: options.size,
		})

		console.log(chalk.yellow(directory))
		console.log(structure)
	})
	.parseAsync()
