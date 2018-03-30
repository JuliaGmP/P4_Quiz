const Sequelize = require('sequelize');

const {log, biglog, errorlog, colorize} = require("./out");

const {models} = require('./model');

/**
 *Funciones resumidas
 */

exports.helpCmd = (socket,rl) => {
    log(socket,'Commandos:');
    log(socket,'h|help - Muestra esta ayuda.');
    log(socket,'list - Listar los quizzes existentes.');
    log(socket,'show <id> - Muestra la pregunta y la respuesta el quiz indicado.');
    log(socket,'add - Añadir un nuevo quiz interactivamente.');
    log(socket,'delete <id> - Borrar el quiz indicado.');
    log(socket,'edit <id> - Editar el quiz indicado.');
    log(socket,'test <id> - Probar el quiz indicado.');
    log(socket,'p|play - Jugar a preguntar aleatoriamente todos los quizzes.');
    log(socket,'credits - Créditos.');
    log(socket,'q|quit - Salir del programa.');
    rl.prompt();
};

exports.listCmd = (socket,rl) => {


    models.quiz.findAll()
        .each(quiz => {
            log(socket, ` [${colorize(quiz.id, 'magenta')}]: ${quiz.question}`);
        })
        .catch(error => {
            errorlog(socket, error.message);
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

exports.showCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            log(socket, `[${colorize(quiz.id, 'magenta')}]: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`);
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });
};

const makeQuestion = ( rl, text) => {
    return new Sequelize.Promise((resolve, reject) => {
        rl.question( colorize(text, 'red'), answer => {
            resolve(answer.trim());
        })
    })
}

exports.addCmd = (socket, rl) => {

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
            log(socket, `${colorize('Se ha añadido', 'magenta')}: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket, 'El quiz es erroneo: ');
            error.errors.forEach(message => errorlog(message));
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });

};

exports.testCmd = (socket, rl, id) => {
    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }
            rl.question(quiz.question + "? ", answer => {
                if (answer.trim().toLowerCase() === quiz.answer.trim().toLowerCase()) {
                    log(socket, 'Su respuesta es correcta.');
                    biglog(socket, 'Correcta', 'green');
                    rl.prompt();
                }
                else {
                    log(socket, 'Su respuesta es incorrecta.');
                    biglog(socket, 'Incorrecta', 'red');
                    rl.prompt();
                }

            })
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket, 'El quiz es erroneo: ');
            error.errors.forEach(message => errorlog(message));
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });


}

const playOne = (socket, rl, score, quizzes) => {

    if (quizzes.length === 0) {
        log(socket, 'No hay nada más que preguntar.');
        log(socket, 'Fin del examen. Aciertos:');
        biglog(socket, score, 'magenta');
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
                        log(socket, `CORRECTO - Lleva ${score} aciertos.`);

                        playOne(socket, rl, score, quizzes);

                    }
                    else {
                        log(socket, 'INCORRECTO');
                        log(socket, 'Fin del examen. Aciertos:');
                        biglog(socket, score, 'magenta');
                        rl.prompt();
                    }

                })

            }
            else {
                playOne(socket, rl, score, quizzes);
            }
        })

    }
}

exports.playCmd = (socket, rl) => {
    let score = 0;
    let id = 0;
    let quizzes = [];

    models.quiz.findAll()
        .each(quiz => {
            quizzes.push(quiz.id);

        })
        .then(() => {
            if (quizzes.length === 0) {
                log(socket, 'No hay preguntas para realizar el quiz.');
                rl.prompt();
            }
            else {
                playOne(socket, rl, score, quizzes)
            }
        })

};


exports.deleteCmd = (socket, rl, id) => {

    validateId(id)
        .then(id => models.quiz.destroy({where: {id}}))
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        })
};

exports.editCmd = (socket, rl, id) => {

    validateId(id)
        .then(id => models.quiz.findById(id))
        .then(quiz => {
            if (!quiz) {
                throw new Error(`No existe un quiz asociado al id=${id}.`);
            }

            process.stdout.isTTY && setTimeout(() => {
                rl.write(quiz.question)
            }, 0);
            return makeQuestion( rl, 'Introduzca la pregunta: ')
                .then(q => {
                    process.stdout.isTTY && setTimeout(() => {
                        rl.write(quiz.answer)
                    }, 0);
                    return makeQuestion( rl, ' Introduzca la respuesta: ')
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
            log(socket, ` Se ha cambiado el quiz ${colorize(quiz.id, 'magenta')} por: ${quiz.question} ${colorize('=>', 'magenta')} ${quiz.answer}`)
        })
        .catch(Sequelize.ValidationError, error => {
            errorlog(socket, 'El quiz es erroneo: ');
            error.errors.forEach(message => errorlog(message));
        })
        .catch(error => {
            errorlog(socket, error.message);
        })
        .then(() => {
            rl.prompt();
        });


};

exports.creditsCmd = (socket, rl) => {
    log(socket, 'Autora de la pŕatica:');
    log(socket, 'Julia Gómez Pozo', 'green');
    rl.prompt();
};

exports.quitCmd = (socket, rl) => {
    rl.close();
    socket.end();
};