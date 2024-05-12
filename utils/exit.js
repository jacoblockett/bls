import chalk from "chalk"

const exit = (msg, isError) => {
	if (isError) {
		console.error(`${chalk.bgRed(` ${isError} `)}: ${msg}`)
		process.exit(1)
	} else {
		console.log(msg)
		process.exit(0)
	}
}

export default exit
