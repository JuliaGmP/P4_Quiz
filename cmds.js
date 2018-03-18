const Sequelize = require('sequelize');

const {log, biglog, errorlog, colorize} = require("./out");

const {models} = require('./model');

/**
 *Funciones resumidas
 */

exports.helpCmd = rl => {
    log('Commandos:');
    log('h|help - Muestra esta ayuda.');
    log('list - Listar los quizzes existentes.');
    log('show <id> - Muestra la pregunta y la respuesta el quiz indicado.');
    log('add - Añadir un nuevo quiz interactivamente.');
    log('delete <id> - Borrar el quiz indicado.');
    log('edit <id> - Editar el quiz indicado.');
    log('test <id> - Probar el quiz indicado.');
    log('p|play - Jugar a preguntar aleatoriamente todos los quizzes.');
    log('credits - Créditos.');
    log('q|quit - Salir del programa.');
    rl.prompt();
};

exports.listCmd = rl => {


    models.quiz.findAll()
        .each(quiz => {
            log(` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });

};


/**
 * Esta funcion devuelve una promesa que:
 *  - Valida que se ha introducido un valor para el parametro.
 *  - Convierte el parametro en un numero entero.
 *  Si todo va bien, la promesa se satisface y devyelve el valor de id.
 *
 * @param id Parametro con el índice a validar.
 */

const validateId = id => {
    return new Sequelize.Promise((resolve, reject) => {
        if (typeof id === "undefined") {
            reject(new Error(`Falta el parametro <id>.`));
        } else {
            id = parseInt(id); // coger la parte entera y descartar lo demás
            if (Number.isNaN(id)) {
                reject(new Error(`El valor del parámetro <id> no es un número.`));
            } else {
                resolve(id);
            }
        }
    });
};

exports.showCmd = (rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            log(`[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

const makeQuestion = (rl, text) => {
    return new Sequelize.Promise((resolve, reject) => {
        rl.question(colorize(text, 'red'), answer => {
            resolve(answer.trim());
        })
    })
}

exports.addCmd = rl => {

    makeQuestion(rl, ' Introduzca su pregunta: ')
        .then(q => {
            return makeQuestion(rl, 'Introduzca la respuesta: ')
                .then(a => {
                    return {question: q, answer: a};
                });
        })
        .then(quiz => {
            return models.quiz.create(quiz);
        })
        .then(quiz => {
            log(`${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog('El quiz es erroneo: ');
            error.errors.forEach(message => errorlog(message));
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });

};

exports.testCmd = (rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            rl.question(quiz.question + "? ", answer => {
                if (answer.trim().toLowerCase() === quiz.answer.trim().toLowerCase()) {
                    log('Su respuesta es correcta.');
                    biglog('Correcta', 'green');
                    rl.prompt();
                }
                else {
                    log('Su respuesta es incorrecta.');
                    biglog('Incorrecta', 'red');
                    rl.prompt();
                }

            })
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog('El quiz es erroneo: ');
            error.errors.forEach(message => errorlog(message));
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });


}

const playOne = (rl, score, quizzes) => {

    if (quizzes.length === 0) {
        log('No hay nada más que preguntar.');
        log('Fin del examen. Aciertos:');
        biglog(score, 'magenta');
        rl.prompt();}
    else {
        let ids = Math.floor(Math.random() * (quizzes[quizzes.length - 1] + 1 - quizzes[0]) + quizzes[0]);

        models.quiz.findById(ids).then(quiz => {
            let i = quizzes.indexOf(ids);
            if (i !== -1) {
                quizzes.splice(i, 1);


                if (!quiz) {
                    throw new Error(`No existe un quiz asociado al id=${id}.`);
                }
                rl.question(quiz.question + "? ", answer => {
                    if (answer.trim().toLowerCase() === quiz.answer.trim().toLowerCase()) {
                        score++;
                        log(`CORRECTO - Lleva ${score} aciertos.`);

                        playOne(rl, score, quizzes);

                    }
                    else {
                        log('INCORRECTO');
                        log('Fin del examen. Aciertos:');
                        biglog(score, 'magenta');
                        rl.prompt();
                    }

                })

            }
            else {
                playOne(rl, score, quizzes);
            }
        })

    }
}

exports.playCmd = rl => {
    let score = 0;
    let id = 0;
    let quizzes = [];

    models.quiz.findAll()
        .each(quiz => {
            quizzes.push(quiz.id);

        })
        .then(() => {
            if (quizzes.length === 0) {
                log('No hay preguntas para realizar el quiz.');
                rl.prompt();
            }
            else {
                playOne(rl, score, quizzes)
            }
        })

};


exports.deleteCmd = (rl, id) => {

    validateId(id)
        .then(id => models.quiz.destroy({where: {id}}))
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        })
};

exports.editCmd = (rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }

            process.stdout.isTTY && setTimeout(() => {
                rl.write(quiz.question)
            }, 0);
            return makeQuestion(rl, 'Introduzca la pregunta: ')
                .then(q => {
                    process.stdout.isTTY && setTimeout(() => {
                        rl.write(quiz.answer)
                    }, 0);
                    return makeQuestion(rl, ' Introduzca la respuesta: ')
                        .then(a => {
                            quiz.question = q;
                            quiz.answer = a;
                            return quiz;
                        });

                });
        })
        .then(quiz => {
            return quiz.save();
        })
        .then(quiz => {
            log(` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog('El quiz es erroneo: ');
            error.errors.forEach(message => errorlog(message));
        })
        .catch(error => {
            errorlog(error.message);
        })
        .then(() => {
            rl.prompt();
        });


};

exports.creditsCmd = rl => {
    log('Autora de la pŕatica:');
    log('Julia Gómez Pozo', 'green');
    rl.prompt();
};

exports.quitCmd = rl => {
    rl.close();
};