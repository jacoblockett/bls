import fs from "node:fs/promises"
import { existsSync } from "node:fs"
import path from "node:path"

const isValidDirectory = async dir => {
	try {
		const resolved = path.resolve(dir)
		const stats = await fs.stat(resolved)

		if (stats.isDirectory()) return true

		return false
	} catch (error) {
		return false
	}
}

export default isValidDirectory
