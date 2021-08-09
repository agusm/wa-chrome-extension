/** CONFIG */
// var DOMAIN = 'http://localhost:8000'; // development
var DOMAIN = 'https://bot.xxx.com'; // production
var BARANG = 'tas';
/** END CONFIG */


// click button send in api.whatsapp.com
$(() => {
  var url = window.location.href.split("?");
  console.log('url', url[0]);

  if (url[0] === "https://api.whatsapp.com/send") {
    console.log('api wa');

    setInterval(() => {
      document.getElementById('action-button').click();
    }, 1000);

  } else if (url[0] === 'https://web.whatsapp.com/' || url[0] === 'https://web.whatsapp.com/send') {
    console.log('web wa');
    // DEFAULT VAR
    var INITIALIZED = false;
    var repeat;
    var repeatGetData;
    var repeatGetDataFromCMS;
    var INCREMENT = 0;

    /** 
     *  Deteksi Button (Button Send if number is valid / button OK if failed)
     */
    repeat = setInterval(() => {

      // ini untuk mengatur, jika element button send tidak muncul selama lebih dari tiga kali interval,
      // maka ambil new data lagi
      if (INCREMENT > 3) {
        getNewData();
      }

      let errorElement = $('.aymnx > ._2Vo52'); //parent error element
      errorElement = errorElement.text(); // get text from error

      console.log('text: ', errorElement);
      // ERROR HANDLING
      if (errorElement !== '' && errorElement !== null && errorElement.length > 0) {
        INITIALIZED = true;
        console.info('popup shown');
        //auto click OK if exist
        let okButton = document.querySelector('._3PQ7V');
        okButton.addEventListener('click', () => {

          // if invalid number pop-up
          if (errorElement === 'Phone number shared via url is invalid.') {
            console.log('break looping: Phone number shared via url is invalid.');
            clearInterval(repeat);

            updateData(2); //2 = failed
          }

          // if "Trying to reach phone" dont clear interval and dont update
          // just wait for connection with 'repeat' interval

        });
        okButton.click();

        //auto click Close if exist
        let btnClose = $("._2DP8_ > button.qfKkX").last();
        if (btnClose.length > 0) {
          let close = btnClose[0];
          close.addEventListener('click', () => {
            // if "Send message to"
            let unknown = $('._1pYs5').text();
            if (unknown !== '' && unknown !== null && unknown.length > 0) {
              console.log('break looping: Wrong number format');
              clearInterval(repeat);

              updateData(2); //2 = failed
            }
          });

          close.click();
        }

      }

      //IF THERE ARE NO ERRORS
      //ini untuk initialisasi
      let intro = $('._1wSzK').data('asset-intro-image');
      //jika hanya halaman intro, maka langsung check data tanpa monitor tombol send message
      if (intro && INITIALIZED === false) {

        INITIALIZED = true;
        console.log('initialized', INITIALIZED);
        getNewData();
      }
      //  else {}

      //SEND MESSAGE BUTTON
      let btnSend1 = document.querySelector('#main > footer > div > div > button > span');
      // console.log('btn1: ', btnSend1);
      let btnSend2 = document.querySelector('#main > footer > div > button > span');
      // console.log('btn2: ', btnSend2);

      if (btnSend1 || btnSend2) { //jika elementnya ada, random entah itu button 1 atau 2
        let btn;

        // jika button 1 = button send, set variable btn
        if (btnSend1) {
          if (btnSend1.getAttribute('data-icon') === 'send')
            btn = btnSend1;
        }

        // jika button 2 = button send, set variable btn
        if (btnSend2) {
          if (btnSend2.getAttribute('data-icon') === 'send')
            btn = btnSend2;
        }

        // kemudian panggil fungsi untuk send data
        sendData(btn);

      } else { // jika tidak ada element button, maka increment + 1
        INCREMENT++;
      }


    }, 15000); //15 detik

    /**
     * Auto Click Send data in Textbox
     * @param {Element} btn 
     */
    function sendData(btn) {

      console.log('btn', btn);

      btn.addEventListener('click', () => {
        console.log('stop checking btn send');
        clearInterval(repeat);

        console.log('checking message status');
        var message = null;

        /** INTERVAL VERSION */

        var checkStatus = setInterval(() => {

          let newElementMessage = document.querySelectorAll('div[class="FTBzM"] > div.message-out');
          message = newElementMessage[newElementMessage.length - 1].querySelector('div.-N6Gq > div._1RNhZ > div._3MYI2 > div.rhQRM > span').getAttribute('data-icon');
          console.log(message);
          // jika tandanya sudah centang 1 (sent) atau centang 2 (delivered), maka hentikan interval pengulangan
          // kemudian get data lead baru
          if (message === 'msg-check' || message === 'msg-dblcheck' || message === 'msg-dblcheck-ack') {
            clearInterval(checkStatus);
            //update status to 1 = success
            console.log('update status to success')
            updateData(1);
          } else {
            message = undefined;
          }

        }, 1000);
        // AFTER SEND BUTTON CLICKED, check the last message was sent or not...

        /** END INTERVAL VERSION */

      });

      //trigger button send click
      btn.click();
    }

    /**
     * Update data and remove session local storage if data was sent
     * @param {int} status 
     */
    function updateData(status) {
      if (localStorage.getItem('dataID')) {
        if (localStorage.getItem('server')) {
          if (localStorage.getItem('server') === DOMAIN) {
            $.ajax({
              url: DOMAIN + '/api/whatsapp/' + localStorage.getItem('dataID'),
              type: 'PUT',
              data: {
                status: status
              },
              success: (response) => {
                localStorage.removeItem('dataID');
                console.log('updated', response); //default response dari system adalah JSON, jadi gak perlu di parse
                getNewData(); //setelah berhasil update barulah get new data
              }
            });
          }

        } else {
          getNewData();
        }
      } else {
        getNewData();
      }
    }

    /**
     * Get new lead Data from Database and
     * Set Local Storage to save ID (used for update data by ID if failed/success sent message)
     */
    function getNewData() {
      //clear semua looping/checking
      clearInterval(repeat);
      clearTimeout(repeatGetDataFromCMS);
      console.log('Get from bot...');

      repeatGetData = setTimeout(() => {
        $.ajax({
          url: DOMAIN + '/api/whatsapp?barang=' + BARANG,
          success: (response) => {
            console.log(new Date().toLocaleTimeString(), response); //default response = JSON
            if (response.id) {
              clearTimeout(repeatGetData);
              if (typeof(Storage) !== "undefined") {
                localStorage.setItem("dataID", response.id);
                localStorage.setItem("server", DOMAIN);
              } else {
                console.log('Sorry! No Web Storage support..');
              }


              // Jika sebelum redirect ada button send muncul, berarti tadi loadnya agak lambat
              // Maka jangan langsung redirect, tapi cek dulu, jika tidak ada button send, maka redirect untuk send new data``
              let btnSend1 = document.querySelector('#main > footer > div > div > button > span');
              let btnSend2 = document.querySelector('#main > footer > div > button > span');

              if (btnSend1 || btnSend2) { //jika elementnya ada, random entah itu button 1 atau 2
                let btn;

                // jika button 1 = button send, set variable btn
                if (btnSend1) {
                  if (btnSend1.getAttribute('data-icon') === 'send')
                    btn = btnSend1;
                }

                // jika button 2 = button send, set variable btn
                if (btnSend2) {
                  if (btnSend2.getAttribute('data-icon') === 'send')
                    btn = btnSend2;
                }

                // kemudian panggil fungsi untuk send data
                sendData(btn);

              } else {
                window.location.replace(response.content);
              }

            }
          }
        });
      }, 10000); //looping every 10 second
    }

  }
});

setTimeout(() => {
  window.location.reload();
}, 1000 * 300); //300 detik tidak ada response apapun, maka reload halaman