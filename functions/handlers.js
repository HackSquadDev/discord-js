const fs = require('fs');

/**
 * LOAD THE CLIENT EVENTS
 */
const loadEvents = async function (client) {
    const eventFolders = fs.readdirSync("./events");
    for (const folder of eventFolders) {
        const eventFiles = fs.readdirSync(`./events/${folder}`).filter((file) => file.endsWith(".js"));
        for (const file of eventFiles) {
            const event = require(`../events/${folder}/${file}`);
            let eventname = file.replace('.js', '') || null
            if (eventname) {
                client.on(eventname, event.run.bind(null, client))
                //Logger.sendLogs(`Loaded ${file} from ${folder}.`, 'event');
            }
        }
    }
}

/**
 * LOAD THE CLIENT COMMANDS
 */
const loadCommands = async function (client) {
    fs.readdirSync('./commands/base').forEach((dir) => {
        const commandFiles = fs.readdirSync(`./commands/base/${dir}`).filter((f) => f.endsWith('.js'));
        for (const file of commandFiles) {
            const command = require(`../commands/base/${dir}/${file}`);
            if (command) {
                client.commands.set(command.help.name, command);
                command.help.aliases.forEach(alias => {
                    client.aliases.set(alias, command.help.name);
                });
                // Logger.sendLogs(
                //     `Loading Command: ${command.help.name} from Category: ${command.help.category} with Aliases: ${command.help.aliases}`,
                //     'cmd',
                // );
            }
        }
    });
}

/**
 * LOAD THE slash COMMANDS
 */
const loadSlash = async function (client) {
    let slash = [];
    const commandFolders = fs.readdirSync("./commands/slash");
    for (const folder of commandFolders) {
        const commandFiles = fs.readdirSync(`./commands/slash/${folder}`).filter((file) => file.endsWith(".js"));        
        for (const file of commandFiles) {
            const command = require(`../commands/slash/${folder}/${file}`);            
            if (command.name) {
                client.slash.set(command.name, command);
                slash.push(command)
                console.log(`Command: ${file} of Category: ${folder} has been Loaded Successfully!`, 'cmd')
            } else {
                //return client.logger.sendLogs(`Command: ${file} of Category: ${folder} is missing a Name or Name is not a string.`, 'error')
            }
        }
    }
    client.on("ready", async() => {
        await client.application.commands.set(slash).then(() => {
            console.log('Slash Commands have been registered with the Discord API', 'event')
        }).catch((e) => {
            console.error(`Failed to register Slash Commands: ${e.stack}`, 'error')
        })
    })
}

module.exports = {
    loadEvents,
    loadCommands,
    loadSlash
};
