require('dotenv').config();
const http = require('http'); //library untuk web server
const fs = require('fs'); //kayak file processing di bahasa c
const {Configuration, IPGeolocation} = require('ip2location-io-nodejs');

const config = new Configuration(process.env.API_ip2location);
const ip2location = new IPGeolocation(config);
const server = http.createServer( (request, respond) => {

    const target = request.headers['x-forwarded-for'] || request.socket.remoteAddress; 
    //ketika nanya nya target kena, dia bakalan reuqest dan kirim melalui socket(pipe) uyang hubungin program ini sama user
    /* kalau pake hosting gratis, pake x-forwaded biar ga kedetect local host, ibarat kayak perantara 
    bikin hosting send ke jembatan itu terus send ke catatant.txt
    */
    const time = new Date().toLocaleString(); //inisialisasi nanti biar kita bisa cetak waktunya juga
    ip2location.lookup(target, ' ', (err, data) => {
        let lokasi = "gagal melacak";
        if(!err && data.city_name){
            lokasi = `${data.city_name}, ${data.country_name} (${data.as})`;
        }

        const catatan = `[${time}] IP: ${target}, Lokasi: ${lokasi}\n`;
        fs.appendFile('catatan.txt', catatan, (err)=>{
            if (!err) console.log(`Log tersimpan : ${target}`);
            respond.writeHead(404, {'Content-Type': 'text/html'}); //respon masuk ke web html
            respond.end(`
                <!DOCTYPE html>
                <html>
                    <head>
                        <title>404 not found</title>
                        <style> 
                        body {
                            background-color: aliceblue;
                            font-family: Georgia, 'Times New Roman', Times, serif;
                            color :black;
                            display : flex;
                            flex-direction: column;
                            justify-content: center;
                            align-items: center;
                            height : 100vh;
                            overflow : hidden;
                            margin : 0;
                        }
                
                        h1, p { 
                            margin : 0;
                            font-size: 2.5em;
                            padding : 2px 0;
                        }
                        </style>
                    </head>
                    <body>
                        <h1>404 not found</h1>
                        <p>This page couldn't be found</p>
                        <p>Check the link and try again</p>
                    </body>
                </html>
            `);
        });
    });
});

module.exports = server; //deploy server di serahin ke hosting -> saat ini vercel
if(require.main === module){ 
    /*biar bisa di jalanin secara lokal juga, 
    kalau dijalankan dengan vercel -> nilainya false kondisi tidak dijalankan
    kalau dijalankan seecara lokal -> nilainya true kondisi dijalankan*/
    server.listen(3000, () => { 
    console.log("Server nyala!");
    });
}