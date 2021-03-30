'use strict';

const passport = require('passport');

module.exports.info = [
    passport.authenticate('bearer', {session: true}),
    (req, res) => {
        const {user} = req;
        res.json({user_id: user.id, name: user.name, scope: req.authInfo.scope});
    }
];

module.exports.ping = [
    passport.authenticate('bearer', {session: true}),
    (req, res) => {
        res.status(200).send('OK');
    }
];

module.exports.devices = [
    passport.authenticate('bearer', {session: true}),
    (req, res) => {
        const [reqId, authToken] = [req.get('X-Request-Id'), String(req.get('Authorization')).split(' ')[1]];

        try {
            const ltoken = global.authl.findOne({'token': authToken});
            const {userId} = ltoken;

            const r = {
                request_id: reqId,
                payload: {
                    user_id: userId,
                    devices: []
                }
            };

            for (const d of global.devices) {
                const {allowedUsers} = d.custom_data;
                if (Array.isArray(allowedUsers) && allowedUsers.indexOf(userId)) {
                    console.log(d.getInfo());
                    r.payload.devices.push(d.getInfo());
                }
            };
            
            res.status(200).send(r);
        } catch (e) {
            console.error(e);
            res.status(404).send(undefined);
        }
    }
];

module.exports.query = [
    passport.authenticate('bearer', {session: true}),
    (req, res) => {
        const reqId = req.get('X-Request-Id');
        const r = {
            request_id: reqId,
            payload: {
                devices: []
            }
        };

        for (const d of req.body.devices) {
            const ldevice = global.devices.find(device => device.data.id == d.id);
            r.payload.devices.push(ldevice.getState());
        };

        res.status(200).send(r);
    }
];

module.exports.action = [
    passport.authenticate('bearer', {session: true}),
    (req, res) => {
        const reqId = req.get('X-Request-Id');
        const r = {
            request_id: reqId,
            payload: {
                devices: []
            }
        };

        for (const payloadDevice of req.body.payload.devices) {
            const {id} = payloadDevice;

            const capabilities = [];
            const ldevice = global.devices.find(device => device.data.id == id);

            for (const pdc of payloadDevice.capabilities) {
                capabilities.push(ldevice.setCapabilityState(pdc.state.value , pdc.type, pdc.state.instance));
            }
            
            r.payload.devices.push({id, capabilities});
        };

        res.status(200).send(r);
    }
];

module.exports.unlink = [
    passport.authenticate('bearer', {session: true}),
    (req, res) => {
        const reqId = req.get('X-Request-Id');
        const r = {
            request_id: reqId,
        }
        
        res.status(200).send(r);
    }
];