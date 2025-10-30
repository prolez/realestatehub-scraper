const axios = require('axios');

// const URL = "https://admin.prdev.fr/items/";

// const locationExists = URL + 'locations?filter[zipcode][_eq]=' + data.location.zipcode + '&filter[city][_eq]=' + data.location.city;
// console.log(locationExists);
// axios.get(locationExists)
//     .then(res => {
//         console.log(res.data.data);
//     });

const url = "https://admin.example.com/items/locations";
const token = "foobazqux1234567890";
// 11 - Ile-de-France
const urlDept = "https://geo.api.gouv.fr/regions/11/departements?fields=nom,code";
axios.get(urlDept)
    .then(depts => {
        for (var i = 0; i < depts.data.length; ++i) {
            const dept = depts.data[i];
            const urlCo = "https://geo.api.gouv.fr/departements/" + dept.code + "/communes?fields=nom,code,codesPostaux&format=json";

            axios.get(urlCo)
                .then(coms => {
                    var tuples = [];
                    for (var j = 0; j < coms.data.length; ++j) {
                        const com = coms.data[j];
                        var entry = {};
                        entry['city'] = com.nom;
                        entry['city_slug'] = lowerCaseAndRemoveDiacritics(com.nom);
                        entry['insee'] = com.code;
                        entry['zipcode'] = com.codesPostaux[0];
                        // entry['department'] = dept.code;
                        tuples.push(entry);
                    }

                    console.log(urlCo);
                    console.log(tuples.length);

                    for (var k = 0; k < tuples.length; ++k) {
                        const el = tuples[k];
                        sleep(250);
                        axios.post(url, el, {
                            headers: { Authorization: `Bearer ${token}` }
                        });

                    }

                });
        }
    });

function lowerCaseAndRemoveDiacritics(originalText) {
    return originalText.normalize('NFD').replace(/[\u0300-\u036f]/g, "").replace(/'/g, "-")
     .replace(/ /g, "-").toLowerCase();
}

function sleep(milliseconds) {
    const date = Date.now();
    let currentDate = null;
    do {
        currentDate = Date.now();
    } while (currentDate - date < milliseconds);
}