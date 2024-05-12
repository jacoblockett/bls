import Entity from "./Entity.js"

export default async (direntArr, depth) =>
	(
		await Promise.all(
			direntArr.map(async dirent => {
				const ent = new Entity(dirent, depth)

				return {
					original: ent,
					resolved: await ent.resolve(),
				}
			}),
		)
	)
		.sort((a, b) => {
			// Sort by type (directories before files)

			if (a.resolved.isDirectory && !b.resolved.isDirectory) {
				return -1
			} else if (!a.resolved.isDirectory && b.resolved.isDirectory) {
				return 1
			}

			// If both are the same type, sort alphabetically
			return a.original.name.localeCompare(b.original.name)
		})
		.map(e => e.original)
