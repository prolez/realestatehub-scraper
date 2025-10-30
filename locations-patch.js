const axios = require('axios');

const url = "https://admin.example.com/items";
const token = "foobazqux1234567890";
axios.get(url + '/departments')
    .then(depts => {
        for (var i = 0; i < depts.data.data.length; ++i) {
            const dept = depts.data.data[i];
            axios.get(url + '/locations?fields[]=id&filter={"_and":[{"department":{"id":{"_null":true}}},{"zipcode":{"_starts_with":"' + dept.code + '"}}]}')
                .then(locations => {
                    console.log(locations.data.data.length);
                    for (var j = 0; j < locations.data.data.length; ++j) {
                        const location = locations.data.data[j];
                        axios.patch(url + '/locations/' + location.id, {department: dept.id}, {
                            headers: { Authorization: `Bearer ${token}` }
                        }).catch((e) => {
                            console.log(e);
                        });
                        sleep(250);
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