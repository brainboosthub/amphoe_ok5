(function () {
  'use strict';

  var SPREADSHEET_ID = '1FxEEfCDPfcsB5W18tnzbOSovosicT5C15OYsnDaKlW4';
  var FALLBACK_WEB_APP_URL =
    'https://script.google.com/macros/s/AKfycbxvqWwNRKu5GpoVRyDZGdwXRy6ubEgPAg2-stv-G-arF4HRoqkAfP21oTl124ne6CvZ/exec';

  var STORAGE_KEY = 'amphoe_web_app_url_from_exec_b2';
  var savedWebAppUrl = '';

  try {
    savedWebAppUrl = String(localStorage.getItem(STORAGE_KEY) || '').trim();
  } catch (storageError) {
    savedWebAppUrl = '';
  }

  // ใช้ค่าที่อ่านได้ครั้งล่าสุดทันที เพื่อไม่ให้กระทบลำดับการทำงานของระบบเดิม
  window.APP_CONFIG = Object.freeze({
    WEB_APP_URL: savedWebAppUrl || FALLBACK_WEB_APP_URL
  });

  window.__setWebAppUrlFromSheet = function (response) {
    try {
      var rows = response && response.table && response.table.rows;
      var cell = rows && rows[0] && rows[0].c && rows[0].c[0];
      var sheetUrl = String((cell && (cell.v || cell.f)) || '').trim();

      // รับเฉพาะ Google Apps Script Web App URL ที่ลงท้ายด้วย /exec
      if (/^https:\/\/script\.google\.com\/macros\/s\/[A-Za-z0-9_-]+\/exec(?:[?#].*)?$/.test(sheetUrl)) {
        sheetUrl = sheetUrl.split(/[?#]/)[0];
        var currentUrl = window.APP_CONFIG.WEB_APP_URL;

        try {
          localStorage.setItem(STORAGE_KEY, sheetUrl);
        } catch (storageError) {
          // หากเบราว์เซอร์ปิด localStorage ระบบยังใช้ URL สำรองได้ตามปกติ
        }

        window.APP_CONFIG = Object.freeze({
          WEB_APP_URL: sheetUrl
        });

        // JavaScript เดิมเก็บ URL ไว้ตั้งแต่เริ่มหน้า จึงรีโหลดเพียงครั้งเดียว
        // เมื่อค่าใน B2 เปลี่ยน เพื่อให้ทุกส่วนใช้ URL ใหม่พร้อมกัน
        if (sheetUrl !== currentUrl) {
          window.location.reload();
        }
      } else if (sheetUrl) {
        console.warn('exec!B2 ไม่ใช่ Google Apps Script Web App URL ที่ถูกต้อง');
      }
    } catch (error) {
      console.warn('อ่าน WEB_APP_URL จาก exec!B2 ไม่สำเร็จ ใช้ URL สำรองแทน', error);
    }
  };

  // อ่าน B2 แบบ JSONP โดยไม่ใช้ document.write จึงไม่รบกวน HTML และ CSS
  var queryUrl =
    'https://docs.google.com/spreadsheets/d/' +
    encodeURIComponent(SPREADSHEET_ID) +
    '/gviz/tq?sheet=exec&range=B2&tqx=out:json;responseHandler:__setWebAppUrlFromSheet&_=' +
    Date.now();

  var script = document.createElement('script');
  script.src = queryUrl;
  script.async = true;
  script.onerror = function () {
    console.warn('อ่าน exec!B2 ไม่สำเร็จ ใช้ WEB_APP_URL สำรองแทน');
  };
  document.head.appendChild(script);
})();
