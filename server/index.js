require('dotenv').config();

const bodyParser = require('body-parser');
const exphbs = require('express-handlebars');
const express = require('express');
const Project = require('../common/project');

const postToSlack = Project.env === 'prod';
const api = require('./api');
const spm = require('./middleware/single-page-middleware');
const webpackMiddleware = require('./middleware/webpack-middleware');
const env = require('../common/project').env;
const slackClient = require('./slack-client');

const SLACK_TOKEN = process.env.SLACK_TOKEN;
const slackMessage = SLACK_TOKEN && require('./slack-client');

const E2E_SLACK_CHANNEL_NAME = process.env.E2E_SLACK_CHANNEL_NAME;

// const isDev = process.env.NODE_ENV !== 'production';
// const isDev = !(process.env.NODE_ENV === 'prod' || process.env.NODE_ENV === 'qa' || process.env.NODE_ENV === 'rnd')
const isDev = (process.env.IS_DEV === 'true' || process.env.IS_DEV === 'True' || process.env.IS_DEV === 'TRUE')
const app = express();
const port = process.env.PORT || 8080;

if (isDev) { // Serve files from src directory and use webpack-dev-server
    console.log('Enabled Webpack Hot Reloading');
    webpackMiddleware(app);
    app.set('views', 'web/');
    app.use(express.static('web'));
} else { // Serve files from build directory
    console.log('Running production mode');
    app.use(express.static('build'));
    app.set('views', 'build/');
}

app.engine('handlebars', exphbs());
app.set('view engine', 'handlebars');

// parse various different custom JSON types as JSON
app.use(bodyParser.json());

app.use('/api', api());
app.use(spm);
app.get('/', (req, res) => {
    console.log('Returning index');
    if (isDev) {
        return res.render('index', {
            isDev,
        });
    }
    return res.render('static/index', {
        isDev,
    });
});

app.post('/api/event', (req, res) => {
    res.json({ });
    try {
        const body = req.body;
        if (process.env.SLACK_TOKEN && process.env.EVENTS_SLACK_CHANNEL && postToSlack && !body.event.includes('Bullet Train')) {
            const match = body.event.match(/([a-zA-Z0-9_\-\.]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/);
            let url = '';
            if (match && match[0]) {
                const urlMatch = match[0].split('@')[1];
                url = ` https://www.similarweb.com/website/${urlMatch}`;
            }
            slackClient(body.event + url, process.env.EVENTS_SLACK_CHANNEL);
        }
    } catch (e) {

    }
});

app.post('/api/webhook', (req, res) => {
    try {
        const body = req.body;
        let message = '';
        res.json(body);
        if (body.data) {
            const state = body.data.new_state;
            if (state.identity_identifier) {
                message = `\`${env} webhook:\` ${body.data.changed_by} changed \`${state.feature.name}\` to \`${state.feature.type === 'FLAG' ? state.enabled : state.feature_state_value || state.feature.initial_value}\` for user \`${state.identity_identifier}(${state.identity})\``;
            } else {
                message = `\`${env} webhook:\` ${body.data.changed_by} changed \`${state.feature.name}\` to \`${state.feature.type === 'FLAG' ? state.enabled : state.feature_state_value || state.feature.initial_value}\``;
            }
            if (slackMessage) {
                slackMessage(message, E2E_SLACK_CHANNEL_NAME);
            }
        }
    } catch (e) {
        console.log(e);
        res.json({ error: e.message || e });
    }
});

// app.post('/api/events', (req, res) => {
//     try {
//         const body = req.body;
//         let message = '';
//         res.json(body);
//         if (process.env) {
//             const state = body.data.new_state;
//             if (state.identity_identifier) {
//                 message = `\`${env} webhook:\` ${body.data.changed_by} changed \`${state.feature.name}\` to \`${state.feature.type === 'FLAG' ? state.enabled : state.feature_state_value || state.feature.initial_value}\` for user \`${state.identity_identifier}(${state.identity})\``;
//             } else {
//                 message = `\`${env} webhook:\` ${body.data.changed_by} changed \`${state.feature.name}\` to \`${state.feature.type === 'FLAG' ? state.enabled : state.feature_state_value || state.feature.initial_value}\``;
//             }
//             if (slackMessage) {
//                 slackMessage(message, E2E_SLACK_CHANNEL_NAME);
//             }
//         }
//     } catch (e) {
//         console.log(e);
//         res.json({ error: e.message || e });
//     }
// });

if (process.env.SLACK_TOKEN && process.env.DEPLOYMENT_SLACK_CHANNEL && postToSlack) {
    slackClient('Server started', process.env.DEPLOYMENT_SLACK_CHANNEL);
}

app.listen(port, () => {
    console.log(`Server listening on: ${port}`);
});
