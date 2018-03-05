
const fs = require("fs");

// Fichero de texto donde se guardan las preguntas.

const DB_FILENAME = "quizzes.json"

//Modelo de datos.
//
//Array de objetos, donde cada objetos tienes los atributos quiestion
// y answer.

let quizzes = [
    {
        question: "Capital de Italia",
        answer: "Roma"
    },
    {
        question: "Capital de Francia",
        answer: "París"
    },
    {
        question: "Capital de España",
        answer: "Madrid"
    },
    {
        question: "Capital de Portugal",
        answer: "Lisboa"
    }
];

/** Este método carga el contenido del fichero DB_FILENAME en la variabl quizzes.
* La primera vez que se ejecuta se producirá el error ENOENT, en ese caso
* se salva el contenido inicial almacenado en quizzes.
*/

const load = () => {
    fs.readFile(DB_FILENAME, (err,data) => {
        if (err) {
            // La primera vez no existe el fichero
            if (err.code === "ENOENT") {
                save(); //valores iniciales
                return;
            }
            throw err;
        }
        let json = JSON.parse(data);
        if (json) {
            quizzes = json;
        }
    });
};

/**
 * Guarda las preguntas en el fichero.
 */

const save = () => {

    fs.writeFile(DB_FILENAME,
        JSON.stringify(quizzes),
        err => {
        if (err) throw err;
        });
};

/**
 * Devuelve el número total de preguntas existentes.
 *
 * @returns {numbre} número total de preguntas existentes.
 */
exports.count = () => quizzes.length;


/**
 * Añade un nuevo quiz.
 *
 * @param question String con la pregunta
 * @param answer String con la respuesta.
 */
exports.add = (question, answer) => {
    quizzes.push({
        question: (question || "").trim(),
        answer: (answer || "").trim()
    });
    save();
};

/**
 * Actualiza el quiz situado en la posicion indez
 *
 * @param id Clave que identifica el quiz a actualizar.
 * @param question String con la pregunta
 * @param answer String con la respuesta
 */
exports.update = (id, question, answer) => {
    const quiz = quizzes[id];li
    if (typeof  quiz === "undefined") {
        throw new error(`El valor del parámetro id no es válido.`);
    }
    quizzes.splice(id, 1, {
        question: (question || "").trim(),
        answer: (answer || "").trim()
    });
    save();
};

/**Devuelve todos los quizzes existentes.
 * @returns {any} Devuelve un clon.
 */
exports.getAll = () => JSON.parse(JSON.stringify(quizzes));

/**
 * Devuelve un clon del quiz almacenado en la posición dada.
 * @param id Clave que identifica el quiz a devolver.
 * @returns {question, answer} Devuelve el objeto quiz de la posición dada
 */
exports.getByIndex = id => {
    const quiz = quizzes[id];
    if (typeof quiz === "undefined") {
        throw new Error(`El Valor del parámetro id no es válido.`)
    }
    return JSON.parse(JSON.stringify(quiz));
};

/**
 * Elimina el quiz situado en la posición dada.
 *
 * @param id Clave que identifica el quiz a borrar.
 */

exports.deleteByIndex = id => {
    const quiz = quizzes[id];
    if (typeof quiz === "undefined"){
        throw new Error(`El valor del parámetro id no es válido.`);
    }
    quizzes.splice(id, 1);
    save();
};

// Carga los quizzes almacenados en el ficheor.
load();