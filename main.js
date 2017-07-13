const color_message = 0x3498db;
const color_message_error = 0xdb3434;


const discord = require ("discord.js");
const fs = require ('fs');
const config = require ('./config.json');
var ssh_client = require ('ssh2').Client;

var ssh_connection = new ssh_client ();

const bot = new discord.Client ();
bot.login (config['bot_token']);

bot.on ('ready', () => console.log (`Logged in as ${bot.user.tag}!`));


const main_commands = {
    'exec' : (msg, params) => {
        if (!params.length) { return; }
        
        ssh_connection.exec (params, (err, stream) => {
            if (err) { console.log (err); return; }
            
            stream.on ('data', data => bot_message (msg, data.toString ()))
            .stderr.on ('data', data => bot_message_error (msg, data.toString ()));
        });
    }
};

bot.on ('message', msg => {
    if (msg.member.id != 206789210009632768 || msg.author.bot || !msg.content.startsWith ('sys')) { return; }
    
    const params = msg.content.replace ('sys', '').trim ();

    if (!excecute_cmd (msg, main_commands, params)) {
        msg.reply ('cmd not found');
    }
});


ssh_connection.on ('error', err => console.log (err)).connect ({
    host: config['ssh']['host'],
    port: config['ssh']['port'],
    username: config['ssh']['user'],
    privateKey: fs.readFileSync (config['ssh']['key'])
});

bot_message = (msg, text) =>
    msg.reply ('', { embed: {
        color: color_message,
        author: {
            name: bot.user.username,
            icon_url: bot.user.avatarURL
        },
        description: text
    }});

bot_message_error = (msg, text) =>
    msg.reply ('', { embed: {
        color: color_message_error,
        author: {
            name: bot.user.username,
            icon_url: bot.user.avatarURL
        },
        description: text
    }});

excecute_cmd = (msg, commands, params) => {
    const run_cmd = params.match (/^[\S]+/i);
    if (run_cmd) {
        const cmd = commands[run_cmd[0].toLowerCase ()];
        if (cmd) {
            cmd.call (commands, msg, params.replace (/^[\S]+\s*/i, ''));
            return true;
        }
    }
    return false;
}