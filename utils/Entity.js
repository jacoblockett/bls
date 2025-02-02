import fs from "node:fs/promises"
import path from "node:path"

export default class Entity {
	#isSymbolicLink
	#isDirectory
	#isCWD
	#name
	#path
	#joinedPath
	#depth // depth in relation to eldest ancestor

	constructor(dirent, depth = 1) {
		this.#isSymbolicLink = dirent.isSymbolicLink()
		this.#isDirectory = dirent.isDirectory()
		this.#name = dirent.name
		this.#path = dirent.parentPath
		this.#joinedPath = path.join(dirent.parentPath, dirent.name)
		this.#isCWD = process.cwd() === this.#joinedPath
		this.#depth = depth
	}

	get isSymbolicLink() {
		return this.#isSymbolicLink
	}

	get isDirectory() {
		return this.#isDirectory
	}

	get name() {
		return this.#name
	}

	get path() {
		return this.#path
	}

	get joinedPath() {
		return this.#joinedPath
	}

	get depth() {
		return this.#depth
	}

	get isCWD() {
		return this.#isCWD
	}

	async size() {
		try {
			const stats = await fs.stat(this.#joinedPath)

			return stats.size
		} catch (error) {
			return 0
		}
	}

	async count() {
		try {
			const dir = await fs.readdir(this.#joinedPath)

			return dir.length
		} catch (error) {
			return 0
		}
	}

	async truePath() {
		if (this.#isSymbolicLink) {
			return await fs.realpath(this.#joinedPath)
		} else {
			return this.#joinedPath
		}
	}

	async resolve() {
		if (!this.#isSymbolicLink) return this

		const truePath = await this.truePath()
		const directory = path.dirname(truePath)
		const name = path.basename(truePath)
		const readDirectory = await fs.readdir(directory, { withFileTypes: true })

		return new Entity(readDirectory.find(dir => dir.name === name))
	}

	async stats() {
		return await fs.stat(this.#joinedPath)
	}

	async lstats() {
		return await fs.lstat(this.#joinedPath)
	}

	#toHundredths(n) {
		return parseFloat(n.toFixed(2))
	}

	#formatSize(size, unit = "B") {
		if (!Number.isInteger(size) || size < 0) throw new TypeError("Expected size to be an integer >= 0")
		if (typeof unit !== "string") throw new TypeError("Expected unit to be a string")

		const ALLOWED_UNITS = ["B", "KB", "MB", "GB", "TB", "PB", "SMART"]
		const UNIT_INDEX = ALLOWED_UNITS.indexOf(unit.toUpperCase())

		if (UNIT_INDEX === -1) throw new TypeError(`Expected unit to be one of ${ALLOWED_UNITS.join(", ")}`)

		if (ALLOWED_UNITS[UNIT_INDEX] === "SMART") {
			ALLOWED_UNITS.pop()

			let i = 0
			while (i < ALLOWED_UNITS.length) {
				const nextSize = size / 1024

				if (nextSize < 1) return `${this.#toHundredths(size)} ${ALLOWED_UNITS[i]}`

				size = nextSize
				i++
			}

			return `${this.#toHundredths(size)} ${ALLOWED_UNITS[i]}`
		} else {
			const unitSize = UNIT_INDEX > 0 ? size / Math.pow(1024, UNIT_INDEX) : size

			return `${this.#toHundredths(unitSize)} ${ALLOWED_UNITS[UNIT_INDEX]}`
		}
	}

	async calculateSize(unit = "B") {
		if (!this.#isDirectory) return this.#formatSize(await this.size(), unit)

		let size = 0 // in bytes
		let entries = await this.readdir()

		while (entries.length) {
			const entry = new Entity(entries.shift())

			if (entry.isDirectory) {
				const entriesToAdd = await entry.readdir()

				entries = [...entriesToAdd, ...entries]
			} else {
				size += await entry.size()
			}
		}

		return this.#formatSize(size, unit)
	}

	async readdir(options = {}) {
		if (!this.#isDirectory) throw new Error(`${this.#joinedPath} is not a directory`)
		if (options !== null && options.constructor.name !== "Object")
			throw new TypeError(`Expected options to be an object`)

		options = {
			withFileTypes: typeof options.withFileTypes === "boolean" ? options.withFileTypes : true
		}

		return await fs.readdir(this.#joinedPath, options)
	}
}
