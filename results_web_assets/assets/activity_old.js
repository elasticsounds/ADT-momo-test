const ActivityTypes = Object.freeze({
  MULTIPLE_CHOICE: "activity_multiple_choice",
  FILL_IN_THE_BLANK: "activity_fill_in_the_blank",
  SORTING: "activity_sorting",
  OPEN_ENDED_ANSWER: "activity_open_ended_answer",
});

function prepareActivity() {
  // Select all sections with role="activity"
  const activitySections = document.querySelectorAll(
    'section[role="activity"]'
  );

  // Select the submit button
  const submitButton = document.getElementById("submit-button");

  if (activitySections.length === 0) {
    submitButton.style.display = "none";
  } else {
    activitySections.forEach((section) => {
      const activityType = section.dataset.sectionType;

      switch (activityType) {
        case ActivityTypes.MULTIPLE_CHOICE:
          prepareMultipleChoiceActivity(section);
          submitButton.addEventListener("click", () =>
            validateInputs(ActivityTypes.MULTIPLE_CHOICE)
          );
          break;
        case ActivityTypes.FILL_IN_THE_BLANK:
          submitButton.addEventListener("click", () =>
            validateInputs(ActivityTypes.FILL_IN_THE_BLANK)
          );
          break;
        case ActivityTypes.OPEN_ENDED_ANSWER:
          submitButton.addEventListener("click", () =>
            validateInputs(ActivityTypes.OPEN_ENDED_ANSWER)
          );
          break;
        case ActivityTypes.SORTING:
          prepareSortingActivity(section);
          submitButton.addEventListener("click", () =>
            validateInputs(ActivityTypes.SORTING)
          );
          break;
        default:
          console.error("Unknown activity type:", activityType);
      }
    });
  }
}

function prepareMultipleChoiceActivity(section) {
  const buttons = section.querySelectorAll("button");
  buttons.forEach((button) => {
    button.onclick = function () {
      selectButton(button);
    };
  });

  let selectedPill = null;
}

function selectButton(button) {
  // Hide possible error messages
  // const noSelectionMessage = document.getElementById('no-selection-error-message');
  // const errorMessage = document.getElementById('error-message');
  // noSelectionMessage.classList.add('hidden');
  // errorMessage.classList.add('hidden');
  // Deselect all buttons first
  document.querySelectorAll(".grid button").forEach((btn) => {
    btn.classList.remove("bg-blue-500", "text-white");
    btn.classList.add("bg-gray-200");
    btn.classList.add("hover:bg-gray-300");
  });

  // Select the clicked button
  button.classList.remove("bg-gray-200");
  button.classList.remove("hover:bg-gray-300");
  button.classList.add("bg-blue-500", "text-white");
  // Set the selected button
  selectedPill = button;
}

function validateInputs(activityType) {
  switch (activityType) {
    case ActivityTypes.MULTIPLE_CHOICE:
      checkMultipleChoice();
      break;
    case ActivityTypes.FILL_IN_THE_BLANK:
      checkFillInTheBlank();
      break;
    case ActivityTypes.OPEN_ENDED_ANSWER:
      checkTextInputs();
      break;
    case ActivityTypes.SORTING:
      checkSorting();
      break;
    default:
      console.error("Unknown validation type:", activityType);
  }
}

function autofillCorrectAnswers() {
  const inputs = document.querySelectorAll('input[type="text"]');

  inputs.forEach((input) => {
    const dataActivityItem = input.getAttribute("data-activity-item");
    const correctAnswer = correctAnswers[dataActivityItem];

    if (correctAnswer) {
      input.value = correctAnswer;
    }
  });
}

function provideFeedback(element, isCorrect, _correctAnswer, activityType) {
  let feedback = element.parentNode.querySelector(".feedback");
  if (!feedback) {
    feedback = document.createElement("span");
    feedback.classList.add(
      "feedback",
      "ml-2",
      "px-2",
      "py-1",
      "rounded-full",
      "text-sm",
      "w-32",
      "text-center"
    );
    element.parentNode.appendChild(feedback);
  }
  feedback.innerText = "";
  feedback.classList.remove(
    "bg-green-200",
    "text-green-700",
    "bg-red-200",
    "text-red-700"
  );

  if (isCorrect) {
    if (activityType === ActivityTypes.OPEN_ENDED_ANSWER) {
      feedback.innerText = "Thank you";
    } else {
      feedback.innerText = "Well done!";
    }
    feedback.classList.add("bg-green-200", "text-green-700");
  } else {
    feedback.innerText = "Try Again";
    feedback.classList.add("bg-red-200", "text-red-700");
  }
}

function checkMultipleChoice() {
  const noSelectionMessage = document.getElementById(
    "no-selection-error-message"
  );

  if (!selectedPill) {
    noSelectionMessage.classList.remove("hidden");
    return;
  }

  const dataActivityItem = selectedPill.getAttribute("data-activity-item");
  const isCorrect = correctAnswers[dataActivityItem];
  console.log(isCorrect); // Debugging purposes

  provideFeedback(selectedPill, isCorrect, correctAnswers[dataActivityItem]);

  if (isCorrect) {
    selectedPill.classList.add("bg-green-600");
  } else {
    selectedPill.classList.add("bg-red-200");
    selectedPill.classList.add("text-black");
  }

  updateSubmitButtonAndToast(
    isCorrect,
    "Next Activity",
    ActivityTypes.MULTIPLE_CHOICE
  );
}

function checkFillInTheBlank() {
  const inputs = document.querySelectorAll('input[type="text"]');
  let allCorrect = true;

  inputs.forEach((input) => {
    const dataActivityItem = input.getAttribute("data-activity-item"); // Assuming each input has a data-activity-item attribute
    const correctAnswer = correctAnswers[dataActivityItem]; // Get the correct answer based on the data-activity-item
    const isCorrect =
      correctAnswer &&
      correctAnswer.toLowerCase() === input.value.trim().toLowerCase(); // Compare the input value with the correct answer

    provideFeedback(
      input,
      isCorrect,
      correctAnswer,
      ActivityTypes.FILL_IN_THE_BLANK
    );

    if (!isCorrect) {
      allCorrect = false;
    }
  });

  updateSubmitButtonAndToast(
    allCorrect,
    "Next Activity",
    ActivityTypes.FILL_IN_THE_BLANK
  );
}

function checkTextInputs() {
  const textInputs = document.querySelectorAll('input[type="text"], textarea');
  let allFilled = true;

  textInputs.forEach((input) => {
    const isCorrect = input.value.trim() !== "";

    provideFeedback(input, isCorrect, "");

    if (!isCorrect) {
      allFilled = false;
    }
  });

  updateSubmitButtonAndToast(
    allFilled,
    "Next Activity",
    ActivityTypes.OPEN_ENDED_ANSWER
  );
}

function updateSubmitButtonAndToast(
  isCorrect,
  buttonText = "Next Activity",
  activityType
) {
  const submitButton = document.getElementById("submit-button");
  const toast = document.getElementById("toast");

  if (isCorrect) {
    submitButton.textContent = buttonText;
    toast.classList.remove("hidden");
    toast.classList.remove("bg-red-200", "text-red-700");
    toast.classList.add("bg-green-200", "text-green-700");

    if (activityType === ActivityTypes.OPEN_ENDED_ANSWER) {
      toast.textContent = "Your answers have been submitted!";
    } else {
      toast.textContent = "Well done!";
    }

    if (buttonText === "Next Activity") {
      submitButton.removeEventListener("click", validateInputs); // Remove the current click handler
      submitButton.addEventListener("click", nextPage); // Add the new click handler
    }

    // Hide the Toast after 3 seconds
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);
  } else {
    if (activityType === ActivityTypes.OPEN_ENDED_ANSWER) {
      toast.textContent = "Please complete all fields";
      toast.classList.remove("hidden");
      toast.classList.add("bg-red-200", "text-red-700");
    }
    setTimeout(() => {
      toast.classList.add("hidden");
    }, 3000);
  }
}

// SORTING ACTIVITY

function prepareSortingActivity(section) {
  const wordList = document.getElementById("word-list");
  let correctCount = "";
  let incorrectCount = "";
  let currentWord = "";
  words.forEach((word) => {
    const wordCard = document.createElement("div");
    wordCard.textContent = word;
    wordCard.className =
      "bg-yellow-100 border border-gray-300 shadow-lg p-2 m-1 rounded word-card";
    wordCard.draggable = true;
    wordCard.addEventListener("click", () => selectWord(wordCard));
    wordCard.addEventListener("dragstart", drag);
    wordCard.addEventListener("mousedown", () => highlightBoxes(true));
    wordCard.addEventListener("mouseup", () => highlightBoxes(false));
    const naturalCategory = document.getElementById("natural-category");
    const artificialCategory = document.getElementById("artificial-category");
    naturalCategory.addEventListener("dragover", allowDrop);
    naturalCategory.addEventListener("drop", drop);
    naturalCategory.addEventListener("click", () => placeWord("natural"));
    artificialCategory.addEventListener("dragover", allowDrop);
    artificialCategory.addEventListener("drop", drop);
    artificialCategory.addEventListener("click", () => placeWord("artificial"));
    document
      .getElementById("feedback")
      .addEventListener("click", resetActivity);
    wordList.appendChild(wordCard);
  });

  document
    .getElementById("submit-button")
    .addEventListener("click", checkSorting);
}

function highlightBoxes(state) {
  const naturalCategory = document.getElementById("natural-category");
  const artificialCategory = document.getElementById("artificial-category");
  if (state) {
    naturalCategory.classList.add("highlight");
    artificialCategory.classList.add("highlight");
  } else {
    naturalCategory.classList.remove("highlight");
    artificialCategory.classList.remove("highlight");
  }
}

function selectWord(wordCard) {
  if (wordCard.classList.contains("bg-gray-300")) return;

  document
    .querySelectorAll(".word-card")
    .forEach((card) => card.classList.remove("bg-blue-300"));
  wordCard.classList.add("bg-blue-300");
  currentWord = wordCard.textContent;

  highlightBoxes(true);
}

function placeWord(category) {
  if (!currentWord) return;

  const listId = category === "natural" ? "natural-list" : "artificial-list";
  const listItem = document.createElement("li");
  listItem.textContent = currentWord;
  listItem.className = "bg-gray-200 p-2 m-1 rounded word-card";
  listItem.setAttribute("data-category", category);
  listItem.addEventListener("click", () => removeWord(listItem));
  document.getElementById(listId).appendChild(listItem);

  const wordCard = Array.from(document.querySelectorAll(".word-card")).find(
    (card) => card.textContent === currentWord
  );
  if (wordCard) {
    wordCard.classList.add(
      "bg-gray-300",
      "cursor-not-allowed",
      "text-gray-400"
    );
    wordCard.classList.remove("selected", "shadow-lg");
  }

  currentWord = "";
  highlightBoxes(false);
}

//Commented out code for being able to remove a word from a box
function removeWord(listItem) {
  const wordCard = Array.from(document.querySelectorAll(".word-card")).find(
    (card) => card.textContent === listItem.textContent
  );
  if (wordCard) {
    wordCard.classList.remove(
      "bg-gray-300",
      "cursor-not-allowed",
      "bg-blue-300",
      "text-gray-400"
    );
    wordCard.classList.add("bg-yellow-200");
  }
  listItem.remove();
}

function checkSorting() {
  const feedbackElement = document.getElementById("feedback");
  let correctCount = 0;
  let incorrectCount = 0;

  words.forEach((word) => {
    const correctCategory = correctAnswers[word];
    const listItems = document.querySelectorAll(`li[data-category]`);

    listItems.forEach((item) => {
      if (item.textContent === word) {
        if (item.getAttribute("data-category") === correctCategory) {
          item.classList.add("correct");
          item.classList.remove("incorrect");
          item.innerHTML += ' <i class="fas fa-check"></i>';
          correctCount++;
        } else {
          item.classList.add("incorrect");
          item.classList.remove("correct");
          item.innerHTML += ' <i class="fas fa-times"></i>';
          incorrectCount++;
        }
      }
    });
  });

  const allCorrect = correctCount === words.length;

  feedbackElement.textContent = `You have ${correctCount} correct answers and ${incorrectCount} incorrect answers. Try Again?`;
  feedbackElement.classList.remove("text-red-500", "text-green-500");
  feedbackElement.classList.add(
    correctCount === words.length ? "text-green-500" : "text-red-500"
  );

  // Update the submit button and toast based on whether all answers are correct
  updateSubmitButtonAndToast(
    allCorrect,
    allCorrect ? "Next Activity" : "Retry"
  );
}

function resetActivity() {
  currentWord = "";
  document.querySelectorAll("li").forEach((item) => item.remove());
  document.querySelectorAll(".word-card").forEach((card) => {
    card.classList.remove(
      "bg-gray-300",
      "cursor-not-allowed",
      "bg-blue-300",
      "text-gray-400"
    );
    card.classList.add("bg-yellow-100", "shadow-lg");
  });

  highlightBoxes(false);
  document.getElementById("feedback").textContent = "";
}

function allowDrop(event) {
  event.preventDefault();
}

function drag(event) {
  event.dataTransfer.setData("text", event.target.textContent);
  event.target.classList.add("selected");
  highlightBoxes(true);
}

function drop(event) {
  event.preventDefault();
  const data = event.dataTransfer.getData("text");
  currentWord = data;
  placeWord(
    event.target.closest(".category").id.includes("natural")
      ? "natural"
      : "artificial"
  );
  highlightBoxes(false);
}
