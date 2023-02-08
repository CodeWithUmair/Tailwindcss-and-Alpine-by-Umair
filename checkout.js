/**
 * Custom Checkout - Javascript
 */

// Get elements
const companyField = document.querySelector('#checkout_shipping_address_company');

// Add document page load events
document.addEventListener('page:load', displayExtraFields, false);
document.addEventListener('page:load', checkAttributes, false);
document.addEventListener('page:load', checkAllFields, false);
document.addEventListener('page:load', showTermsLink, false);
document.addEventListener('page:load', addShippingRate, false);
document.addEventListener('page:load', changeLoginUrl, false);
document.addEventListener('page:load', addODOOEmailCheck, false);
document.addEventListener('page:load', hideSubscribeCheckbox, false);
document.addEventListener('page:load', selectSavedAdress, false);

// Add document page change events
document.addEventListener('page:change', displayExtraFields, false);

// Add element change events
companyField?.addEventListener('change', displayExtraFields, false);

// Hide elements
document.querySelector('div[data-buyer-accepts-marketing]').remove(); // Remove subscribe checkbox

// Insert checkout attributes at every step to make sure they're passed through
function checkAttributes() {
  const attributes = document.querySelector('#checkout-attributes');
  const attributesClone = attributes?.content.cloneNode(true);
  const attributesContainer = document.querySelector('.step form #checkout-attributes-container');
  const form = document.querySelector('.step form');

  if (!attributesContainer) {
    form.insertBefore(attributesClone, form.firstChild);
  }
}

function checkCurrentCurrency(currentCurrency) {
  localStorage.setItem('checkoutOpened', true);

  if (currentCurrency !== Shopify.Checkout.currency || localStorage.getItem('currencyChanged')) {
    alert(theme.locales.needToReturn);
    localStorage.removeItem('checkoutOpened');
    window.location.href = '/cart';
  }
}

function hideSubscribeCheckbox() {
  if (Shopify.Checkout.step === 'contact_information') {
    const subscribeCheckboxContainer = document
      .querySelector('#checkout_buyer_accepts_marketing')
      .closest('[data-buyer-accepts-marketing]');

    const loggedInCustomer = document.querySelector('.logged-in-customer-information');

    loggedInCustomer && subscribeCheckboxContainer.setAttribute('hidden', '');
  }
}

function changeLoginUrl() {
  if (Shopify.Checkout.step === 'contact_information') {
    const attributes = document.querySelector('#checkout-attributes-container');
    const ODOOLoginUrl = attributes.querySelector('[name="checkout[attributes][odoo_login]"]')?.value;

    if (ODOOLoginUrl === undefined) return;

    const loginLinksArr = Array.from(document.querySelectorAll('.section--contact-information a'));

    const loginContainer = loginLinksArr.find((link) => link.href.includes('/account/login'));

    loginContainer.href = ODOOLoginUrl;
  }
}

function addShippingRate() {
  if (Shopify.Checkout.step === 'contact_information') {
    const attributes = document.querySelector('#checkout-attributes-container');
    const shippingRateObj = JSON.parse(attributes.querySelector('[name="checkout[attributes][shipping-rate]"]').value);
    const shippingRateContainer = document.querySelector('.total-line--shipping .total-line__price span');
    const vatContainer = document.querySelector('.total-line--taxes .total-line__price span');

    checkCurrentCurrency(shippingRateObj.calculatedCurrency);
    const totalPriceContainer = document.querySelector(
      '.total-line-table__footer .total-line__price .payment-due__price'
    );

    if (!shippingRateObj.freeShipping) {
      vatContainer.innerHTML = shippingRateObj.summaryVat;
      totalPriceContainer.innerHTML = shippingRateObj.summaryPrice;
    }

    shippingRateContainer.innerHTML = shippingRateObj.shippingRate;
    shippingRateContainer.classList.remove('order-summary__small-text');
    shippingRateContainer.classList.add('order-summary__emphasis');
  }
}

function selectSavedAdress() {
  if (Shopify.Checkout.step === 'contact_information') {
    const adressSelector = document.querySelector('[data-address-selector]');
    const adressSelectorOptions = adressSelector?.options;

    const customerId = document
      .querySelector('.logged-in-customer-information .page-main__emphasis')
      ?.textContent.toLowerCase();

    if (!customerId || !adressSelectorOptions) return;

    const savedAdressOption = Array.from(adressSelectorOptions).find(
      (el) => el.label.toLowerCase().includes(customerId) || el.label.toLowerCase().match(/(\(\w\s\w\))/g)
    );

    adressSelector.selectedIndex = savedAdressOption.index;
  }
}

function addODOOEmailCheck() {
  if (Shopify.Checkout.step === 'contact_information') {
    const checkoutEmail = document.querySelector('#checkout_email');
    const attributes = document.querySelector('#checkout-attributes-container');
    const ODOOApiLink = attributes.querySelector('[name="checkout[attributes][odoo_api_link]"]')?.value;

    const showAlert = (response) => {
      if (response.result['ODOO-checkout']) {
        const ODDOLogin = attributes.querySelector('[name="checkout[attributes][odoo_login]"]');

        if (ODDOLogin === undefined) return;

        const ODOOLoginUrl = ODDOLogin.value;
        const confirmationTextLabel = ODDOLogin.dataset.confirmationText;

        const redirectToLogin = confirm(confirmationTextLabel);

        redirectToLogin && (window.location.href = ODOOLoginUrl);
      }
    };

    checkoutEmail.addEventListener('change', () => {
      const dataObj = {
        params: {
          email: checkoutEmail.value,
        },
      };

      if (ODOOApiLink === undefined) return;

      fetch(ODOOApiLink, {
        headers: {
          'Content-Type': 'application/json',
        },
        method: 'POST',
        body: JSON.stringify(dataObj),
      })
        .then((data) => data.json())
        .then((resp) => showAlert(resp));
    });
  }
}

// Display extra fields
function displayExtraFields() {
  const addressFields = document.querySelector('[data-address-fields]');
  const additionalFields = document.querySelector('#company-additional-fields');
  const additionalFieldsClone = additionalFields?.content.cloneNode(true);
  const additionalFieldsContainer = document.querySelector('#company-additional-fields-container');

  if (companyField && companyField.value === '' && additionalFieldsContainer) {
    // Remove container from address fields
    addressFields.removeChild(additionalFieldsContainer);
  } else if (
    Shopify.Checkout.step === 'contact_information' &&
    companyField &&
    !document.querySelector('.step #company-additional-fields-container')
  ) {
    // Append clone to the end of address fields
    addressFields.appendChild(additionalFieldsClone);

    // Get custom email input
    const shippingAddressInvoiceEmail = document.querySelector('#checkout_shipping_address_invoice_email');

    // Listen for changes on the custom email input
    shippingAddressInvoiceEmail.addEventListener('change', () => {
      let email = shippingAddressInvoiceEmail.value;
      validateEmail(email);
    });
  } else if (Shopify.Checkout.step === 'shipping_method') {
    const shippingWrapper = document.querySelector('.section--shipping-method');
    const checkoutAttributesWrapper = document.querySelector('#checkout-attributes');
    const estimatedDelivery =
      checkoutAttributesWrapper?.content?.children['checkout-attributes-container']?.children[
        'checkout[attributes][estimated_delivery]'
      ]?.value;
    let estimatedDeliveryHTML = document.createElement('div');

    estimatedDeliveryHTML.innerHTML = estimatedDelivery;
    estimatedDeliveryHTML.classList.add('cart__delivery-estimation');
    shippingWrapper.appendChild(estimatedDeliveryHTML);
  }
}

// Validate email
function validateEmail(email) {
  const regex = /(.+)@(.+){2,}\.(.+){2,}/;
  const invoiceError = document.querySelector('#data-invoice-email-error').value;
  const shippingAddressInvoiceEmail = document.querySelector('#checkout_shipping_address_invoice_email');

  // Create the message
  const element = document.createElement('p');
  element.id = 'invoice-error';
  element.className = 'field__message field__message--error';
  element.style.display = 'block';
  element.innerHTML = invoiceError;

  const customError = document.querySelector('#invoice-error');
  if (email == '') {
    customError.remove();
  } else {
    if (!regex.test(email)) {
      if (!customError) {
        shippingAddressInvoiceEmail.after(element);
      }
    } else {
      customError.remove();
    }
  }
}

function showTermsLink() {
  if (Shopify.Checkout.step == 'payment_method' && !document.querySelector('.step form #checkout-terms-link-elem')) {
    const billingAddress = document.querySelector('[data-billing-address]');
    const termsLink = document.querySelector('#checkout-terms-link');

    // Clone the content
    const termsLinkClone = termsLink?.content.cloneNode(true);

    // Append the content
    billingAddress.appendChild(termsLinkClone);
  }
}

function checkAllFields() {
  if (Shopify.Checkout.step === 'contact_information') {
    const submitForm = document.querySelector('[data-customer-information-form]');
    const vatFieldContainer = submitForm.querySelector('.field--vat-number');
    const vatFieldInput = vatFieldContainer.querySelector('input');
    const countryField = submitForm.querySelector('#checkout_shipping_address_country');
    const regexes = {
      'AT': '(AT)?U[0-9]{8}',
      'BE': '(BE)?[0]{0,1}[0-9]{9}',
      'BG': '(BG)?[0-9]{9,10}',
      'CY': '(CY)?[0-9]{8}[A-Z]',
      'CZ': '(CZ)?[0-9]{8,10}',
      'DE': '(DE)?[0-9]{9}',
      'DK': '(DK)?[0-9]{8}',
      'EE': '(EE)?[0-9]{9}',
      'GR': '(GR)?[0-9]{9}|(EL)?[0-9]{9}',
      'ES': '(ES)?[0-9A-Z][0-9]{7}[0-9A-Z]',
      'FI': '(FI)?[0-9]{8}',
      'FR': '(FR)?[0-9A-Z]{2}[0-9]{9}',
      'GB': '(GB)?([0-9]{9,12}|(GD[1-9]\d{2})|(HA[1-9]\d{2}))',
      'HR': '(HR)?\\d{11}',
      'HU': '(HU)?[0-9]{8}',
      'IE': '(IE)([0-9A-Z\\*\\+]{7}[A-Z]{1,2}$)',
      'IT': '(IT)?[0-9]{11}',
      'LT': '(LT)?([0-9]{9}|[0-9]{12})',
      'LU': '(LU)?[0-9]{8}',
      'LV': '(LV)?[0-9]{11}',
      'MT': '(MT)?[0-9]{8}',
      'NL': '(NL)?[0-9]{9}B[0-9]{2}',
      'PL': '(PL)?[0-9]{10}',
      'PT': '(PT)?[0-9]{9}',
      'RO': '(RO)?[0-9]{2,10}',
      'SE': '(SE)?[0-9]{12}',
      'SI': '(SI)?[0-9]{8}',
      'SK': '(SK)?[0-9]{10}'
    };

    const getSelectedCountry = (field) => {
      return field.selectedOptions[0].dataset.code.toString();
    }
    const setStoredVAT = () => {
      if (
        sessionStorage.getItem('vatNumber') &&
        sessionStorage.getItem('vatNumber') !== vatFieldInput.value &&
        vatFieldInput.value === ''
      ) {
        vatFieldInput.value = sessionStorage.getItem('vatNumber');
        vatFieldContainer.classList.add('field--show-floating-label');
      }
    }
    const setVatPattern = (selectedCountry) => {
      const selectedRegex = regexes[selectedCountry];

      selectedRegex
        ? vatFieldInput.setAttribute('pattern', `^${selectedRegex}`)
        : vatFieldInput.removeAttribute('pattern');
    }
    const checkVatValidity = () => {
      if (vatFieldInput.validity.patternMismatch) {
        vatFieldContainer.classList.toggle('field--error', true);
        vatFieldContainer.classList.add('field--show-floating-label');
      } else {
        sessionStorage.setItem('vatNumber', vatFieldInput.value);
        vatFieldContainer.classList.toggle('field--error', false);
      }
    }

    setStoredVAT();
    setVatPattern(getSelectedCountry(countryField));

    countryField.addEventListener('change', () => {
      setVatPattern(getSelectedCountry(countryField));
      checkVatValidity();
    });
    vatFieldInput.addEventListener('change', () => {
      vatFieldContainer.classList.toggle('field--error', false);
    });
    vatFieldInput.addEventListener('focusout', checkVatValidity);
    submitForm.querySelector('#continue_button').addEventListener('click', (e) => {
      if (submitForm.querySelector(':invalid') !== null) {
        e.preventDefault();
      }
    });
  }
}

// (function($) {
//   var companyField = $('#checkout_shipping_address_company');
//   function displayExtraFields() {
//       if(Shopify.Checkout.step == 'contact_information' && companyField.length && companyField.val() != '' && !$('.step #company-additional-fields-container').length) {
//           var additionalFields = $('template#company-additional-fields').html();
//           $(additionalFields).insertAfter($('[data-address-fields]'));
//       } else if(companyField.length && companyField.val() == '') {
//           $('.step #company-additional-fields').remove();
//       }
//   }
//   function validateEmail(email) {
//       if( /(.+)@(.+){2,}\.(.+){2,}/.test(email) ){
//           $("#invoice-error").remove();
//         } else {
//             if(!$("#invoice-error").length) {
//               var invoiceError = '<p id="invoice-error" class="field__message field__message--error" style="display: block;">' + $('#data-invoice-email-error').val() + '</p>';
//               $(invoiceError).insertAfter($('input#checkout_shipping_address_invoice_email'));
//             }
//         }
//   }
//   $(document).on("page:load", function() {

//       // Insert checkout attributes at every step to make sure they're passed through
//       var attributes = $('#checkout-attributes').html();
//       if(!$('.step form #checkout-attributes-container').length) {
//           $('.step form').prepend($(attributes));
//       }

//       displayExtraFields();

//       companyField.on('change', function() {
//           displayExtraFields();
//       });

//       $(document).on('change', '#checkout_shipping_address_invoice_email', function() {
//           var enteredEmail = $('#checkout_shipping_address_invoice_email').val();
//           validateEmail(enteredEmail);
//       });

//       if(Shopify.Checkout.step == 'payment_method' && !$('.step form #checkout-terms-link-elem').length) {
//           var termsLink = $('#checkout-terms-link').html();
//           $(termsLink).insertBefore($('.step__footer'));
//       }

//   });

//   $(document).on("page:load page:change", function() {
//       displayExtraFields();

//       $('[data-address-selector]').on('change', function() {
//           displayExtraFields();
//       });
//   });

// })(Checkout.$);
