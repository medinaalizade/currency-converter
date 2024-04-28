  const token = "c3c7c29feb803c52b3948e26";
  const currencies = ["rub", "usd", "eur", "gbp"];
  let leftActiveCurrency = currencies[0];
  let rightActiveCurrency = currencies[1];

  const generateRateString = (value, currentCurrency, oppositeCurrency) => {
    return [
      1,
      currentCurrency.toUpperCase(),
      "=",
      value ? value.toString() : "",
      oppositeCurrency.toUpperCase()
    ].join(" ");
  };

  const convertCurrency = async (from, to, amount) => {
    const url = `https://v6.exchangerate-api.com/v6/${token}/latest/${from}`;
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error('Network is not ok');
      }
      const data = await res.json();
      return data.conversion_rates[to.toUpperCase()] * amount;
    } catch (error) {
      if (error instanceof TypeError) {
        console.error('Network error:', error);
      } else {
        console.error("Failed to fetch currency rates:", error);
      }
      throw new Error("Failed to fetch currency rates.");
    }
  };

  const renderCurrencyButton = (currency, isLeft) => {
    const container = isLeft ? document.querySelector(".convert .currency") : document.querySelector(".converted .currency");
    const btn = document.createElement("button");
    btn.textContent = currency.toUpperCase();
    container.appendChild(btn);
    if ((isLeft && currency === leftActiveCurrency) || (!isLeft && currency === rightActiveCurrency)) {
      btn.classList.add("active");
    }
    btn.addEventListener("click", async function(event) {
      const currencyDiv = this.parentNode;
      const activeButton = currencyDiv.querySelector('.active');
      if (activeButton) {
        activeButton.classList.remove('active');
      }
      this.classList.add("active");
      if (isLeft) {
        leftActiveCurrency = currency;
      } else {
        rightActiveCurrency = currency;
      }
      const userInputValue = document.querySelector(".numeric").value;
      await convertValue(true);
      await convertValue(false);
      renderCurrencyRate();
      document.querySelector(".numeric").value = userInputValue;
    });    
  };

  const renderButtons = () => {
    currencies.forEach(currency => {
      renderCurrencyButton(currency, true);
      renderCurrencyButton(currency, false);
    });
  };

  const validateValue = (value) => {
    value = value.replace(",", ".");
    const hasDotInEnd = value.endsWith(".");
    let [fullPart, dotPart] = value.split(".");
    return [fullPart, hasDotInEnd || (dotPart && dotPart.length > 0) ? "." : "", dotPart]
      .filter(Boolean)
      .join("");
  };

  const convertValue = async (isLeft) => {
    const activeCurrency = isLeft ? leftActiveCurrency : rightActiveCurrency;
    const oppositeCurrency = isLeft ? rightActiveCurrency : leftActiveCurrency;

    const currentInput = isLeft ? document.querySelector(".convert input") : document.querySelector(".converted input");
    const otherInput = isLeft ? document.querySelector(".converted input") : document.querySelector(".convert input");
    const val = currentInput.value;
    
    if (!val) {
      otherInput.value = "";
      return;
    }
    if (activeCurrency === oppositeCurrency) {
      otherInput.value = val;
      return;
    }
    
    let convertedValue = await convertCurrency(activeCurrency, oppositeCurrency, parseFloat(val));
    if (!convertedValue) return;
    convertedValue = convertedValue.toFixed(5);
    otherInput.value = convertedValue;
    console.log(convertedValue);
    
  };

  const handleInput = (isLeft) => {
    const input = isLeft ? document.querySelector(".convert input") : document.querySelector(".converted input");
    input.addEventListener("input", async function() {
      this.value = this.value.replace(/[^\d.,]/, "")
                               .replace(/^0{2,}/, "0")
                               .replace(/^0(\d)/, "$1");
      if (this.value.startsWith(".")) this.value = "0" + this.value;
      if (this.value.endsWith(",")) this.value = this.value;
      this.value = validateValue(this.value);
      await convertValue(isLeft);
    });
  };

  const renderCurrencyRate = async () => {
    const leftCurrencyRate = document.querySelector(".convert .currency-text");
    const rightCurrencyRate = document.querySelector(".converted .currency-text");
    if (leftActiveCurrency === rightActiveCurrency) {
      leftCurrencyRate.textContent = generateRateString(1, leftActiveCurrency, rightActiveCurrency);
      rightCurrencyRate.textContent = generateRateString(1, rightActiveCurrency, leftActiveCurrency);
    } else {
      const [current, opposite] = await Promise.all([
        convertCurrency(leftActiveCurrency, rightActiveCurrency, 1),
        convertCurrency(rightActiveCurrency, leftActiveCurrency, 1)
      ]);
      leftCurrencyRate.textContent = generateRateString(current, leftActiveCurrency, rightActiveCurrency);
      rightCurrencyRate.textContent = generateRateString(opposite, rightActiveCurrency, leftActiveCurrency);
    }
  };

  renderButtons();
  handleInput(true);
  handleInput(false);
  renderCurrencyRate();

  

  