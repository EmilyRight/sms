/* eslint-disable no-use-before-define */

import { WOW } from './vendor/wow.min';
import detectDevice from './components/detectDevice';
import regionsData from './data/regionsData';
import { closeModal, openModal } from './components/modal';
import {
  fieldListener, validateFields, keyField, prepField,
} from './components/inputs';
import { generateId } from './components/utils';
import GTMEvents from './components/gtmEvents';

const GTM = new GTMEvents();

/// /////// DocReady //////////
window.addEventListener('load', () => {
  detectDevice(); // videoTeaser();
  new WOW().init();
  scrollTeaser();
  GTM.addEventListeners();
  getCurrentYear();
  goNextSection();
  showRegion();
  openPopup();
  chooseRegion();
  confirmRegion();
  const { body } = document;

  // Показать поле ИНН
  const innF = document.querySelectorAll('.js-toggle-inn');
  [...innF].forEach((_btn) => {
    _btn.addEventListener('click', (bt) => {
      const holder = document.querySelector('.js-inn-holder');
      const v = '_visible';
      const innFld = document.querySelector('.js-inn');
      if (!bt.target.classList.contains('on')) {
        holder.classList.add(v); innFld.focus();
      } else {
        holder.classList.remove(v); innFld.value = '';
        // focus on button form
      }
      bt.target.classList.toggle('on');
    });
  });

  // INPUTS
  fieldListener(body, ['mousemove', 'mouseover', 'mouseout', 'blur'], prepField);
  fieldListener(body, ['focus', 'click', 'beforeinput', 'keydown', 'change', 'paste', 'input'], keyField);

  // BUTTON SUBM
  const $formBtn = document.querySelectorAll('.js-new-req');
  [...$formBtn].forEach((btn) => { btn.addEventListener('click', (e) => { e.preventDefault(); trySubmit(); }); });

  function trySubmit() {
    validateFields();
    // document.querySelector('.selectorinn').style.display = 'none';
    const errorCount = document.querySelectorAll('.text-error').length;
    const frmReady = (errorCount === 0);
    if (frmReady) {
      submitCustomFormRequest();
    } else {
      console.warn('UNREADY SUBMIT');
    }
  }

  /*  let $fish = document.querySelectorAll('.fish');
  [... $fish].forEach( (ff) => {ff.addEventListener('click',(e)=> {e.preventDefault();
    ff.classList.toggle('ss');
  });}); */
}); // end DocReady
/// ///////////////////////////

function toggleLoader() {
  const loader = document.querySelector('.loader');
  loader.classList.toggle('hidden');
}

function submitCustomFormRequest() {
  const $frm = document.querySelector('.crm-request-form');
  const $submitBtn = document.querySelector('.js-new-req');
  const innField = document.querySelector('#innField');

  const inn = (innField.value.length >= 10) ? innField.value : '';
  // document.querySelector('#innField').value || '';
  const name = document.querySelector('#nameField').value;
  const phone = document.querySelector('#telField').value;

  const siteId = localStorage.getItem('siteId') || 'siteMSK';
  const url = `api/customForm/submission?siteId=${siteId}&formId=CrmMyTeamRequest`;
  // const tariffFrontName = 'corp-ats';

  const requestBody = {
    MainContact: name,
    Phone: phone,
    requestCategory: '1',
    requestId: `${Date.now()}_${Math.random().toString().slice(2, 12)}`,
    region: siteId.slice(4).toLowerCase(),
    InnCompany: inn,
    AdditionalInformation: 'Подключение услуги Корпоративная АТС',
    options: [{ name: 'Корпоративная АТС' }],
  };
  const requestGTM = {
    eventAction: 'send',
    eventLabel: 'checkout_corp-ats-form_server_response',
    requestId: `corp-ats_${Date.now()}${generateId(12)}`,
    eventCategory: 'Conversions',
    eventContent: requestBody.requestId, // eventContent: ,
    eventContext: 'successful',
    transactionPaymentType: null,
    transactionShippingMethod: null,
  };

  toggleLoader();
  fetch(url, {
    method: 'POST',
    body: JSON.stringify({ data: requestBody }),
    headers: { Accept: 'application/json, text/plain', 'Content-Type': 'application/json;charset=UTF-8' },
  })
    .then(() => { // console.log(r);
      GTM.gaPush(requestGTM);
      closeModal('#req-modal-box');
      openModal('#succ-modal-box');
    })
    .catch(() => {
      closeModal('#req-modal-box');
      openModal('#error-modal-box');// console.log('something wrong');
      requestGTM.eventContext = 'unsuccessful';
      GTM.gaPush(requestGTM);
    })
    .finally(() => toggleLoader());
}

function goNextSection() {
  const goNextBtns = document.querySelectorAll('.js-go-next');
  const sectionsList = document.querySelectorAll('section');

  goNextBtns.forEach((btn) => {
    btn.addEventListener('click', () => {
      const btnParentNode = btn.closest('section');
      let sectionToScrollTo;
      sectionsList.forEach((el, index) => {
        if (el === btnParentNode) {
          sectionToScrollTo = sectionsList[index + 1];
          scrollToElement(sectionToScrollTo);
        }
      });
    });
  });
}

function scrollToElement(el) {
  const offs = 0;
  const y = el.getBoundingClientRect().top + window.scrollY + offs;
  window.scrollTo({ top: y, behavior: 'smooth' }); // element.scrollIntoView();
}

// handle region

async function getJSON() {
  const response = await fetch('http://api.sypexgeo.net/');
  const data = await response.json();
  return data.region.name_ru;
}

function showRegion() {
  const id = localStorage.getItem('siteId') || 'siteMSK';
  const regionName = regionsData.find(({ siteId }) => siteId === id)?.name;
  const regionSpan = document.querySelectorAll('.js-regionFullName');
  regionSpan.forEach((it) => {
    it.innerHTML = `${regionName}`;
  });
}

function setRegion(cityCode) {
  const regionName = regionsData.find(({ siteId }) => siteId === cityCode)?.name;
  const regionSpan = document.querySelector('.selected-region__name');
  regionSpan.innerHTML = `${regionName}`;
  localStorage.setItem('siteId', cityCode);
}

function chooseRegion() {
  const regionsList = document.querySelectorAll('.js-set-city');
  regionsList.forEach((region) => {
    region.addEventListener('click', () => {
      const cityCode = region.getAttribute('data-area');
      setRegion(cityCode);
      openPopup();
      hideRegionQuestion();
    });
  });
}

function openPopup() {
  const popupLinksList = document.querySelectorAll('.open-popup-modal');
  const regionsList = document.querySelectorAll('.js-set-city');
  popupLinksList.forEach((link) => {
    const { popup } = link.dataset;

    link.addEventListener('click', () => {
      openModal(`#${popup}`);
    });
  });

  regionsList.forEach((link) => {
    link.addEventListener('click', () => {
      const modal = link.closest('.modal-box');
      const { id } = modal;

      closeModal(`#${id}`);
    });
  });
}

function hideRegionQuestion() {
  const id = localStorage.getItem('siteId');
  const regionModalHeader = document.querySelector('.ask-for-region');
  const regionFullName = document.querySelector('.selected-region');
  const defaultRegion = 'siteMSK';
  if (id) {
    regionModalHeader.style.display = 'none';
    regionFullName.classList.remove('hidden');
  } else {
    localStorage.setItem('siteId', defaultRegion);
    regionModalHeader.style.display = 'none';
    regionFullName.classList.remove('hidden');
  }
}

function confirmRegion() {
  const regionConfirmButton = document.querySelector('.js-region-ok');
  regionConfirmButton.addEventListener('click', () => {
    hideRegionQuestion();
  });
}

// scroll to next if URL contains #about

function scrollTeaser() {
  const { hash } = window.location;
  if (hash) {
    const id = hash.slice(1);
    const section = document.getElementById(id);
    scrollToElement(section);
  }
}

function getCurrentYear() {
  const yearSpan = document.querySelectorAll('.current-year');
  yearSpan.forEach((span) => {
    span.innerHTML = new Date().getFullYear().toString();
  });
}
