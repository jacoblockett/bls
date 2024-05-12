import fs from "node:fs/promises"
import path from "node:path"
import chalk from "chalk"
import wcwidth from "wcwidth"
import stripAnsi from "strip-ansi"
import exit from "./exit.js"
import {
	NODE_MAIN,
	NODE_LAST,
	NODE_CONNECTOR,
	DIR_ICON,
	DIR_OPEN_ICON,
	FILE_ICON,
	SYM_ICON,
	CWD_ICON,
} from "./constants.js"
import isValidDirectory from "./isValidDirectory.js"
import buildEntities from "./buildEntities.js"

const dullWhite = chalk.hex("#CCCCCC")
const pink = chalk.hex("#eb7fd9")

export default async (directory, options = {}) => {
	if (!(await isValidDirectory(directory)))
		exit(`'${path.resolve(directory)}' is not a directory`, "Error")
	if (options === null || options.constructor.name !== "Object")
		throw new TypeError(`Expected options to be an object`)

	options = {
		calculateSize: typeof options.calculateSize === "boolean" ? options.calculateSize : false,
		maxDepth: Number.isInteger(options.maxDepth) && options.maxDepth > 0 ? options.maxDepth : 1,
	}

	try {
		let entities = await buildEntities(await fs.readdir(directory, { withFileTypes: true }), 1)

		const components = []
		const widths = [{ cc: 0, n: 0, s: 0, hasCWD: false }]

		let chunkID = 0
		let previousChunkDepth = 1

		while (entities.length) {
			const entity = entities.shift()

			if (previousChunkDepth !== entity.depth) {
				chunkID++
				widths.push({ cc: 0, n: 0, s: 0, hasCWD: false })
			}

			const resolvedIsDirectory = (await entity.resolve()).isDirectory
			const childCount = resolvedIsDirectory ? `${await entity.count()}` : ""
			const entityIcon = resolvedIsDirectory ? (entity.isCWD ? DIR_OPEN_ICON : DIR_ICON) : FILE_ICON
			const symIcon = entity.isSymbolicLink ? SYM_ICON : ""
			const cwdIcon = entity.isCWD ? CWD_ICON : ""
			const name = `${symIcon ? `${symIcon} ` : ""}${entity.name}`
			const size = options.calculateSize ? await entity.calculateSize("smart") : ""

			const ccLength = wcwidth(childCount)

			if (ccLength > widths[chunkID].cc) widths[chunkID].cc = ccLength
			if (!widths[chunkID].hasCWD && cwdIcon) widths[chunkID].hasCWD = true

			const nextEntity = entities[0]
			let hasChildren = false

			if (entity.isDirectory && entity.depth < options.maxDepth) {
				const entitiesToAdd = await buildEntities(await entity.readdir(), entity.depth + 1)

				entities = [...entitiesToAdd, ...entities]
				hasChildren = true
			}

			let prefix = ""
			const prefixArm = nextEntity?.depth === entity.depth || hasChildren ? NODE_MAIN : NODE_LAST

			if (entity.depth > 1) {
				prefix = `${`${NODE_CONNECTOR}  `.repeat(entity.depth - 1)}`
			}

			prefix = ` ${prefix}${prefixArm}`

			components.push({
				chunkID,
				prefix,
				entityIcon,
				childCount,
				name,
				cwdIcon,
				size,
				isDirectory: resolvedIsDirectory,
			})

			previousChunkDepth = entity.depth
		}

		// This sets up a running value so that the spacing after the name can be correctly calculated
		for (let i = 0; i < components.length; i++) {
			let { chunkID: cid, prefix, entityIcon, childCount, symIcon, name } = components[i]
			const { cc } = widths[cid]

			prefix = `${chalk.dim(prefix)} `
			entityIcon = `${entityIcon} `
			childCount = childCount ? childCount.padEnd(cc + 1, " ") : ""
			symIcon = symIcon ? `${symIcon} ` : ""

			components[i].prefix = prefix
			components[i].entityIcon = entityIcon
			components[i].runner = `${childCount}${symIcon}${name}`

			const charCount = wcwidth(components[i].runner)
			if (charCount > widths[cid].n) widths[cid].n = charCount
		}

		// This builds each of the full lines. If any data needs formatting alignment after the size,
		// another layer of this process will need to be done, similar to the previous runner-creating loop
		for (let i = 0; i < components.length; i++) {
			let { chunkID: cid, prefix, entityIcon, runner, cwdIcon, size, isDirectory } = components[i]
			const { n, hasCWD } = widths[cid]

			cwdIcon = cwdIcon ? `${chalk.cyan(cwdIcon)} ` : ""
			runner = runner.padEnd(n + 1 + (!cwdIcon && hasCWD ? 2 : 0), " ")
			size = size ? pink(size) : ""

			if (isDirectory) {
				const regex = new RegExp(`(?<childCount>\\d+\\s+)(?<name>.+)`)

				runner = runner.replace(
					regex,
					(_, childCount, name) =>
						`${chalk.dim(childCount)}${cwdIcon ? chalk.bold(name) : dullWhite(name)}`,
				)
			}

			components[i] = `${prefix}${entityIcon}${runner}${cwdIcon}${size}`
		}

		return components.join("\n")
	} catch (e) {
		console.error(e)
	}
}
