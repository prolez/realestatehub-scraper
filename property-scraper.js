const Nightmare = require('nightmare');
const vo = require('vo');
const axios = require('axios');

const nightmare = Nightmare({ show: true });

vo(run)(function (err, result) {
    if (err) throw err;
});

function* run() {
    const programList = [];

    yield nightmare
        .goto('https://example.com/programmes-neufs')
        .wait(".list-layout")
        .wait(1000);

    // const max_page = yield nightmare.evaluate(function () {
    //     return document.querySelector('ul.pagination li:nth-last-child(2) > a').innerText;
    // });

    const max_page = 1;

    let programs = [];
    let currentPage = 0;
    while (currentPage < max_page) {
        programs = programs.concat(yield nightmare
            .evaluate(function () {
                var linkArray = [];
                var programs = document.querySelectorAll('.list-layout .estateCard');
                for (var i = 0; i < programs.length; ++i) {
                    linkArray.push(programs[i].getAttribute('data-url'));
                }
                return linkArray;
            }));

        if (++currentPage < max_page) {
            yield nightmare
                .click('ul.pagination li:last-child > a')
                .wait('.list-layout')
                .wait(1000);
        }
    }

    // TEST UNITAIRE programs = ['/programmes-neufs/logements-neufs-ile-de-france/paris/paris-20eme-75020/25-rue-dannam'];

    for (let index = 0; index < programs.length; index++) {
        const program = programs[index];

        const URL = 'https://example.com' + program;
        yield nightmare
            .goto(URL)
            .wait('.content .container')
            .wait(1000);

        const programDetails = yield nightmare
            .evaluate(function () {
                var details = {};

                details['status'] = "published";
                // Info dans les meta
                var location = {};
                const metas = document.querySelectorAll('[itemtype="http://schema.org/ProfessionalService"] meta');
                for (var i = 0; i < metas.length; ++i) {
                    if (metas[i].getAttribute('itemprop') == 'postalCode') {
                        location['zipcode'] = metas[i].getAttribute('content').trim();
                    }
                    if (metas[i].getAttribute('itemprop') == 'addressLocality') {
                        location['city'] = metas[i].getAttribute('content').trim();
                    }
                    if (metas[i].getAttribute('itemprop') == 'streetAddress') {
                        details['address'] = metas[i].getAttribute('content').trim();
                    }
                    if (metas[i].getAttribute('itemprop') == 'name') {
                        const title = metas[i].getAttribute('content').trim();
                        details['title'] = title; // title.charAt(0).toUpperCase() + title.slice(1).toLowerCase();
                    }
                    if (metas[i].getAttribute('itemprop') == 'description') {
                        details['description'] = metas[i].getAttribute('content');
                    }
                    if (metas[i].getAttribute('itemprop') == 'priceRange') {
                        details['pricefrom'] = metas[i].getAttribute('content').split('de')[1].trim().replace(' ', '').replace('€', '');
                    }
                }
                details['location'] = location;

                // Coordonnées
                const propertyMap = document.querySelector('#propertyMap');
                const coordinates = [propertyMap.getAttribute('data-latitude'), propertyMap.getAttribute('data-longitude')];
                details['coordinates'] = { coordinates: coordinates.reverse(), type: 'Point' };

                // Date de livraison
                const agentContactDetails = document.querySelector('.agent-contact-details');
                if (agentContactDetails.querySelectorAll('li .text-primary')[1]) {
                    const delivery = agentContactDetails.querySelectorAll('li .text-primary')[1].innerText;
                    if (delivery !== '-') {
                        details['delivery_trimester'] = delivery.charAt(0);
                        details['delivery_year'] = delivery.substring(delivery.length - 4, delivery.length);
                    }
                }

                // Fiscalité
                if (agentContactDetails.querySelectorAll('li .text-primary')[2]) {
                    const taxation = agentContactDetails.querySelectorAll('li .text-primary')[2].innerText;
                    if (taxation) {
                        const pills = [];
                        if (taxation.includes('LMNP')) {
                            pills.push({ taxation_id: { id: 1 }});
                        }
                        if (taxation.includes('Pinel')) {
                            pills.push({ taxation_id: { id: 3 }});
                        }
                        details['taxations'] = pills;
                    }
                }

                // Images
                const imagesTab = document.querySelectorAll('.slick-track a.slick-slide');
                var images = [];
                for (var i = 0; i < imagesTab.length; ++i) {
                    images.push(imagesTab[i].href);
                }
                details['images'] = images;

                // Biens associés
                const propertiesTab = document.querySelectorAll('.property-description table tbody tr:not(:first-child)');
                var properties = [];
                for (var i = 0; i < propertiesTab.length; ++i) {
                    var property = {};
                    property['status'] = "published";

                    const tds = propertiesTab[i].querySelectorAll('td, th');
                    // property['length'] = tds.length;
                    if (tds.length === 5) {
                        if (tds[0])
                            property['type'] = tds[0].innerText;
                        if (tds[1]) {
                            const typology = tds[1].innerText;
                            property['typology'] = typology.charAt(0) === 'S' || typology.charAt(0) === '-' ? 1 : typology.substring(1);
                        }
                        if (tds[2])
                            property['living_area'] = tds[2].innerText.split('m')[0];
                        // D => Disponible
                        if (tds[3])
                            property['property_status'] = tds[3].innerText.charAt(0) === 'D' ? '1' : '2';
                    } else if (tds.length === 6) {
                        if (tds[0])
                            property['title'] = tds[0].innerText;
                        if (tds[1])
                            property['type'] = tds[1].innerText;
                        if (tds[2]) {
                            const typology = tds[2].innerText;
                            property['typology'] = typology.charAt(0) === 'S' || typology.charAt(0) === '-' ? 1 : typology.substring(1);
                        }
                        if (tds[3])
                            property['living_area'] = tds[3].innerText.split('m')[0];
                        // D => Disponible
                        if (tds[4])
                            property['property_status'] = tds[4].innerText.charAt(0) === 'D' ? '1' : '2';
                    } else {
                        // D => Disponible
                        if (tds[1])
                            property['property_status'] = tds[1].innerText.charAt(0) === 'D' ? '1' : '2';
                        if (tds[2])
                            property['price'] = tds[2].innerText.replace(/ /g, '').replace('€', '');
                        if (tds[3])
                            property['title'] = tds[3].innerText;
                        if (tds[4])
                            property['type'] = tds[4].innerText;
                        if (tds[5]) {
                            // S => Studio
                            const typology = tds[5].innerText;
                            property['typology'] = typology.charAt(0) === 'S' || typology.charAt(0) === '-' ? 1 : typology.substring(1);
                        }
                        if (tds[6])
                            property['living_area'] = tds[6].innerText.split('m')[0];
                        if (tds[7]) {
                            const floor = tds[7].innerText.charAt(0);
                            // PAVILLON GARNIER ??
                            if (floor === '-')
                                property['floor'] = floor;
                        }
                    }
                    properties.push(property);
                }
                details['properties'] = properties;

                return details;
            });

        programDetails['URL'] = URL;
        programList.push(programDetails);
    }

    yield nightmare.end();

    const url = process.env.API_URL || "https://admin.example.com/";
    const config = {
        headers: { Authorization: `Bearer ${process.env.API_TOKEN}` }
    };

    // Parcours des programmes
    for (var i = 0; i < programList.length; ++i) {
        const program = { ...programList[i] };

        // Test si le programme est déjà présent
        const findedProgram = yield axios.get(url + 'items/programs?filter={"_and":[{"URL":{"_eq":"' + program.URL
            + '"}}]}').then(res => {
                return res.data.data[0];
            });
        if (findedProgram) {
            // Patch des biens sur programme déjà présent
            console.log(`${program.title} présent`);
            // Récupération des biens du programme
            const findedProperties = yield axios.get(url + 'items/properties?filter={"program":{"id":{"_eq":' + findedProgram.id + '}}}').then(res => {
                return res.data.data;
            });
            // Maj des biens vendus (si le bien est absent à droite c'est qu'il est vendu)
            const soldedProperties = findedProperties.filter(fp => !program.properties.some(p => fp.title === p.title));
            for (var z = 0; z < soldedProperties.length; ++z) {
                yield axios.delete(url + 'items/properties/' + soldedProperties[z].id, config)
                .catch(error => {
                    console.error(error);
                });
            }
            // Modification du statut en optionné si besoin
            const optionedProperties = findedProperties.filter(fp => program.properties.some(p => fp.title === p.title && fp.property_status !== p.property_status));
            for (var u = 0; u < optionedProperties.length; ++u) {
                yield axios.patch(url + 'items/properties/' + optionedProperties[u].id, {
                    property_status: optionedProperties[u] === "1" ? "2" : "1"
                }, config).catch(error => {
                    console.error(error);
                });
            }
        } else {
            // Création du programme
            console.log(`${program.title} non présent`);

            // Création du répertoire par programme
            // const folderId = yield axios.post(url + 'folders', {
            //     'name': program.title + ' (' + program.location.zipcode + ')',
            //     'parent': '2712a04d-4950-4989-8e48-b61064260b9c'
            // }, config).then(res => {
            //     return res.data.data.id;
            // });

            // Envoie des images si programme non présent dans le répertoire programme
            const imagesIds = [];
            for (var t = 0; t < program.images.length; ++t) {
                const imageId = yield axios.post(url + 'files/import', {
                    'url': program.images[t],
                    // 'data': {
                    //     'folder': folderId
                    // },
                }, config).then(fo => {
                    return fo.data.data.id;
                }).catch(error => {
                    console.error(error);
                });
                if (imageId) {
                    imagesIds.push(imageId);
                }
            }
            program.images = imagesIds.map(imageId => {
                return { directus_files_id: imageId };
            });

            // Récupération de la location si non présent
            let locationId = yield axios.get(url + 'items/locations?filter={"_and":[{"zipcode":{"_eq":"' + program.location.zipcode + '"}}'
                + ',{"city":{"_contains":"' + program.location.city.split(' ')[0] + '"}}]}').then(res => {
                    if (res.data.data[0]) {
                        return res.data.data[0] ? res.data.data[0].id : '';
                    }
                }).catch(error => {
                    console.error(error);
                });
            // Si récupération en erreur, test avec uniquement la ville
            if (!locationId) {
                locationId = yield axios.get(url + 'items/locations?filter={"_and":[{"city":{"_eq":"' + program.location.city.split(' ')[0] + '"}}]}').then(res => {
                    if (res.data.data[0]) {
                        return res.data.data[0] ? res.data.data[0].id : '';
                    }
                }).catch(error => {
                    console.error(error);
                });
            }

            // Si encore ko (on zap)
            if (!locationId) {
                console.log(`Ajout: ${program.title} KO car pas de localité`);
                console.log(program.URL);
                continue;
            }
            program.location = locationId;

            if (program.properties.length === 0) {
                console.log(`Ajout: ${program.title} KO car aucun biens`);
                console.log(program.URL);
                continue;
            }

            // Ajout du pricefrom si pas de prix présent sur les biens
            if (program.properties && program.properties.every(p => !p.price)) {
                delete program.pricefrom;
            }

            program.title_slug = lowerCaseAndRemoveDiacritics(program.title);

            // Ajout du programme
            yield axios.post(url + 'items/programs', program, config).then(res => {
                console.log(`Ajout: ${program.title} OK`);
                // Envoie de la notif
                // const mail = {
                //     "subject": "Notification d'ajout automatique d'un nouveau programme : " + program.title + " (" + program.location.zipcode + ")",
                //     "text": "Vérifiez sur https://admin.prdev.fr que les informations ont bien été récupérés"
                //   };
                // axios.post(url + 'mailer', mail).catch(error => {
                //     console.error(error);
                // });
                sleep(1000)
            }).catch(error => {
                console.error(error.response.data.errors);
            });
        }

        sleep(1000);
    }
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}

function lowerCaseAndRemoveDiacritics(originalText) {
    return originalText.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/'/g, "-")
    .replace(/ - /g, "-").replace(/ /g, "-").toLowerCase();
}
