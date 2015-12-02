var mongoose = require('mongoose');

var albumSchema = new mongoose.Schema({
    _id: String,
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    title: String,
    summary: String,
    link: String,
    linkjson: String,
    linkself: String,
    img: String,
    imageCount: Number,
    photos: [{
        _id: String,
        sort_index: Number,
        title: String,
        link: String,
        linkself: String,
        images: {
            XXS: {
                width: Number,
                href: String,
                height: Number
            },
            XL: {
                width: Number,
                href: String,
                height: Number
            },
            M: {
                width: Number,
                href: String,
                height: Number
            },
            L: {
                width: Number,
                href: String,
                height: Number
            },
            XXXS: {
                width: Number,
                href: String,
                height: Number
            },
            S: {
                width: Number,
                href: String,
                height: Number
            },
            XS: {
                width: Number,
                href: String,
                height: Number
            },
            XXL: {
                width: Number,
                href: String,
                height: Number
            },
            orig: {
                width: Number,
                href: String,
                bytesize: Number,
                height: Number
            }
        }
    }],
    updated_at: Date
});

module.exports = mongoose.model('Album', albumSchema);
