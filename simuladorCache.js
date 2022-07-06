//Área da configuração
const input_bytesMP = document.getElementById('bytesMP');
const input_celulasMP = document.getElementById('celulasMP');
const input_celulasBlocoMP = document.getElementById('celulasBlocoMP');
const input_linhasMC = document.getElementById('linhasMC');
const select_defMetodoSubstituicao = document.getElementById('defMetodoSubstituicao');
//Área do detalhamento
const span_bitsEndereco = document.getElementById('bitsEndereco');
const span_bitsByteBloco = document.getElementById('bitsByteBloco');
const select_defMapeamento = document.getElementById('defMapeamento');
const span_defLinhasConjunto = document.getElementById('defLinhasConjunto');
const input_linhasConjunto = document.getElementById('linhasConjunto');
const div_representacaoEndereco = document.getElementById('representacaoEndereco');
//Área da simulação
const textarea_enderecos = document.getElementById('enderecos');
const input_velocidade = document.getElementById('velocidade');
const span_velocidadeTexto = document.getElementById('velocidadeTexto');
//Área da memória cache
const div_mc = document.getElementById('mc');
//Área dos endereços para acesso à memória
const div_acessos = document.getElementById('acessos');

//Função pra verificar se um número é potência de 2
const isPowerOfTwo = number => (number & (number - 1)) === 0;

var bytesMP=0;
var celulasMP=0;
var celulasBlocoMP=parseInt(input_celulasBlocoMP.value);
var linhasMC=0;
var bitsEndereco=0;
var bitsByteBloco=0;
var bitsByteConjunto=0;
var bitsByteTag=0;
var linhasConjunto=0;
var enderecos=[];
var conjuntos=[];
var numEnderecoLeitura=0;
var enderecoLendoBits=null;
var conjuntoLendo=null;
var blocoLendo=null;
var acessoResultado=null;
var execucaoSimulacao=null;
var tempoExecucao=calcularTempoExecucao();
var blocosAnteriores=[];
var linhaLeitura=false;

class Conjunto {
    linhas=[];
    div_conjunto=null;
    proximoNumLinha=0;
    constructor(linhasConjunto) {
        for (let i = 0; i < linhasConjunto; i++) {
            let novaLinha=new Linha(0);
            novaLinha.conjuntoPai=this;
            this.linhas.push(novaLinha);
        }
    }
    desenharConjunto(argTexto) {
        this.div_conjunto = document.createElement('div');
        this.div_conjunto.className = 'conjunto';
        this.div_conjunto.innerHTML = argTexto;
        for (let i = 0; i < this.linhas.length; i++) {
            this.div_conjunto.appendChild(this.linhas[i].desenharLinha(i+1));
        }
        return this.div_conjunto;
    }
    proximaLinha() {
        return this.linhas[this.proximoNumLinha];
    }
    linhaLRU() {
        let linhaLRU=this.linhas[0];
        for (let i = 1; i < this.linhas.length; i++) {
            if (this.linhas[i].linhaUso>linhaLRU.linhaUso) {
                linhaLRU=this.linhas[i];
            }
        }
        return linhaLRU;
    }
    atualizarNumLinha() {
        this.proximoNumLinha=(this.proximoNumLinha+1)%this.linhas.length;
    }
    limparCSS() {
        for (let i = 0; i < this.linhas.length; i++) {
            this.linhas[i].limparCSS();
        }
        this.div_conjunto.classList.remove("lendo");
    }
    atualizarUsosLinhas() {
        for (let i = 0; i < this.linhas.length; i++) {
            this.linhas[i].linhaUso++;
        }
    }
}
class Linha {
    valido=false;
    tag='';
    blocos=new Array(celulasBlocoMP);
    div_linha=null;
    div_valido=null;
    div_tag=null;
    div_blocos=null;
    conjuntoPai=null;
    linhaUso=0;
    constructor(argTag) {
        this.atualizarTag(argTag);
    }
    desenharLinha(argNumLinha) {
        this.div_linha=document.createElement('div');
        this.div_linha.className='linha';
        this.div_linha.innerHTML=argNumLinha+": ";
        this.div_valido=document.createElement('div');
        this.div_valido.className='valido';
        this.div_tag=document.createElement('div');
        this.div_tag.className='tag';
        this.div_blocos=document.createElement('div');
        this.div_blocos.className='blocos';
        this.div_linha.appendChild(this.div_valido);
        this.div_linha.appendChild(this.div_tag);
        this.div_linha.appendChild(this.div_blocos);
        this.div_valido.innerHTML="V<br>"+(this.valido?'1':'0');
        this.div_tag.innerHTML="Tag<br>"+this.tag;
        this.div_blocos.innerHTML='Blocos<br>';
        for (let i = 0; i < celulasBlocoMP; i++) {
            if (this.blocos[i]==undefined) {
                this.blocos[i]=0;
            }
            this.div_blocos.innerHTML+=this.blocos[i];
            if (i<celulasBlocoMP-1) {
                this.div_blocos.innerHTML+=' | ';
            }
        }
        return this.div_linha;
    }
    atualizarLinha(argTag,argValorBlocos) {
        this.atualizarTag(argTag);
        this.atribuirValorBlocos(argValorBlocos);
        this.valido=true;
        this.div_valido.innerHTML="V<br>"+(this.valido?'1':'0');
        this.div_tag.innerHTML="Tag<br>"+this.tag.toString();
        this.div_blocos.innerHTML='Blocos<br>';
        for (let i = 0; i < celulasBlocoMP; i++) {
            this.div_blocos.innerHTML+=this.blocos[i];
            if (i<celulasBlocoMP-1) {
                this.div_blocos.innerHTML+=' | ';
            }
        }
        this.conjuntoPai.atualizarNumLinha();
        this.linhaUso=0;
    }
    atribuirValorBlocos(argValorInicial) {
        var valorInicial=argValorInicial-(argValorInicial%celulasBlocoMP);        
        for (let i = 0; i < this.blocos.length; i++) {
            this.blocos[i]=valorInicial+i;
        }
        this.valido=true;
    }
    atualizarTag(argTag) {
        this.tag=argTag.toString();
        while (this.tag.length<bitsByteTag) {
            this.tag='0'+this.tag;
        }
    }
    limparCSS() {
        this.div_linha.classList.remove("lendo");
        this.div_valido.classList.remove("lendo");
        this.div_valido.classList.remove("acerto");
        this.div_valido.classList.remove("falta");
        this.div_tag.classList.remove("lendo");
        this.div_tag.classList.remove("acerto");
        this.div_tag.classList.remove("falta");
        this.div_blocos.classList.remove("lendo");
    }
}

function atualizaConfig() {
    resetarSimulacao(false);
    bytesMP = parseInt(input_bytesMP.value);
    celulasMP = parseInt(input_celulasMP.value);
    if (!isPowerOfTwo(parseInt(input_celulasBlocoMP.value))) {
        if (celulasBlocoMP<parseInt(input_celulasBlocoMP.value)) {
            input_celulasBlocoMP.value=celulasBlocoMP*2;
        } else {
            input_celulasBlocoMP.value=celulasBlocoMP/2;
        }
    }
    celulasBlocoMP = parseInt(input_celulasBlocoMP.value);
    linhasMC = parseInt(input_linhasMC.value);   
    bitsEndereco = Math.log2(celulasMP);
    span_bitsEndereco.innerHTML = bitsEndereco;
    bitsByteBloco = Math.log2(celulasBlocoMP);
    span_bitsByteBloco.innerHTML = bitsByteBloco;
    atualizaMapeamento();
    atualizaVelocidade();
}
function atualizaMapeamento() {
    switch (select_defMapeamento.value) {
        case "direto": {
            span_defLinhasConjunto.style.display="none";
            linhasConjunto=1;
            bitsByteConjunto=Math.log2(linhasMC);
        } break;
        case "totAssociativo": {
            span_defLinhasConjunto.style.display="none";
            bitsByteConjunto=0;
            bitsByteTag=bitsEndereco-bitsByteBloco;
            linhasConjunto=Math.pow(2,bitsByteTag);
        } break;
        case "conjAssociativo": {
            span_defLinhasConjunto.style.display="inline";
            if (!isPowerOfTwo(parseInt(input_linhasConjunto.value))) {
                if (linhasConjunto<parseInt(input_linhasConjunto.value)) {
                    input_linhasConjunto.value=linhasConjunto*2;
                } else {
                    input_linhasConjunto.value=linhasConjunto/2;
                }
            }
            linhasConjunto=parseInt(input_linhasConjunto.value);
            bitsByteConjunto=Math.log2(linhasMC/linhasConjunto);
        } break;
    }
    bitsByteTag=bitsEndereco-bitsByteBloco-bitsByteConjunto;
    div_representacaoEndereco.innerHTML="";
    novaTabela=document.createElement("table");
    novaLinha=document.createElement("tr");
    for (let i=bitsEndereco-1; i>=0; i--) {
        novaCelula=document.createElement("td");
        novaCelula.innerHTML=i;
        novaCelula.className="bit";
        novaLinha.appendChild(novaCelula);
    }
    novaTabela.appendChild(novaLinha);
    novaLinha=document.createElement("tr");
    if (bitsByteTag>0) {
        novaCelula=document.createElement("td");
        novaCelula.colSpan=bitsByteTag;
        novaCelula.className="bit tag";
        novaCelula.innerHTML="Tag<br>"+bitsByteTag+" bits";
        novaLinha.appendChild(novaCelula);
    }
    if (bitsByteConjunto>0) {
        novaCelula=document.createElement("td");
        novaCelula.colSpan=bitsByteConjunto;
        novaCelula.className="bit conjunto";
        novaCelula.innerHTML="Conjunto<br>"+bitsByteConjunto+" bits";
        novaLinha.appendChild(novaCelula);
    }
    if (bitsByteBloco>0) {
        novaCelula=document.createElement("td");
        novaCelula.colSpan=bitsByteBloco;
        novaCelula.className="bit bloco";
        novaCelula.innerHTML="Bloco<br>"+bitsByteBloco+" bits";
        novaLinha.appendChild(novaCelula);
    }
    novaTabela.appendChild(novaLinha);
    div_representacaoEndereco.appendChild(novaTabela);
    atualizaEnderecos();
    atualizaMemoriaCache();
}
function atualizaEnderecos() {
    enderecosTextarea=textarea_enderecos.value.split(",");
    novaTabela=document.createElement("table");
    novaLinha=document.createElement("tr");
    novaCelulaTitulo=document.createElement("th");
    novaCelulaTitulo.innerHTML="Endereço";
    novaLinha.appendChild(novaCelulaTitulo);
    novaCelulaTitulo=document.createElement("th");
    novaCelulaTitulo.innerHTML="Binário";
    novaLinha.appendChild(novaCelulaTitulo);
    novaCelulaTitulo=document.createElement("th");
    novaCelulaTitulo.innerHTML="Acesso";
    novaLinha.appendChild(novaCelulaTitulo);
    novaCelulaTitulo=document.createElement("th");
    novaCelulaTitulo.innerHTML="Descrição";
    novaLinha.appendChild(novaCelulaTitulo);
    novaTabela.appendChild(novaLinha);
    enderecos=[];
    for (let i=0; i<enderecosTextarea.length; i++) {
        enderecos[i]=[];
        enderecos[i][0]=parseInt(enderecosTextarea[i]);
        novaLinha=document.createElement("tr");
        novaCelula=document.createElement("td");
        novaCelula.innerHTML=enderecos[i];
        novaCelula.className="endereco";
        enderecos[i][1]=novaCelula;
        novaLinha.appendChild(novaCelula);
        novaCelula=document.createElement("td");
        let binario=enderecos[i][0].toString(2);
        while (binario.length<bitsEndereco) {
            binario="0"+binario;
        }
        binario=binario.substring(0,bitsByteTag)+" "+binario.substring(bitsByteTag,bitsByteTag+bitsByteConjunto)+" "+binario.substring(bitsByteTag+bitsByteConjunto,bitsEndereco);
        novaCelula.innerHTML=binario;
        novaCelula.className="binario";
        enderecos[i][2]=novaCelula;
        novaLinha.appendChild(novaCelula);
        novaCelula=document.createElement("td");
        novaCelula.innerHTML="";
        novaCelula.className="acesso";
        enderecos[i][3]=novaCelula;
        novaLinha.appendChild(novaCelula);
        novaCelula=document.createElement("td");
        novaCelula.innerHTML="";
        novaCelula.className="descricao";
        enderecos[i][4]=novaCelula;
        novaLinha.appendChild(novaCelula);
        novaTabela.appendChild(novaLinha);
    }
    numEnderecoLeitura=0;
    enderecoLendoBits=null;
    div_acessos.innerHTML="";
    div_acessos.appendChild(novaTabela);
}
function atualizaMemoriaCache() {
    conjuntos=[];
    div_mc.innerHTML="";
    for (let conjunto=0; conjunto<Math.pow(2,bitsByteConjunto); conjunto++) {
        conjuntos[conjunto]=new Conjunto(linhasConjunto);
        idConjunto=conjunto.toString(2);
        while (idConjunto.length<bitsByteConjunto) {
            idConjunto="0"+idConjunto;
        }
        div_mc.appendChild(conjuntos[conjunto].desenharConjunto("Conjunto "+idConjunto));
    }
}
function executarProximaEtapa() {
    if (acessoResultado==null) {
        if (blocoLendo==null) {
            if (conjuntoLendo==null) {
                if (enderecoLendoBits==null) {
                    lerProximoEndereco();
                } else {
                    lerConjunto();
                }
            } else {
                lerBloco();
            }
        } else {
            resolverAcesso();
        }
    } else {
        enderecos[numEnderecoLeitura][1].parentElement.classList.remove("lendo");
        if (acessoResultado=="A") {
            enderecos[numEnderecoLeitura][3].innerHTML="ACERTO";
            enderecos[numEnderecoLeitura][3].classList.add("acerto");
            enderecos[numEnderecoLeitura][4].innerHTML="V é válido e o endereço lido está no bloco.";
        } else if (acessoResultado=="F1") {
            enderecos[numEnderecoLeitura][3].innerHTML="FALTA";
            enderecos[numEnderecoLeitura][3].classList.add("falta");
            let descricaoBloco=blocosAnteriores[0].toString()+".."+blocosAnteriores[blocosAnteriores.length-1].toString();
            enderecos[numEnderecoLeitura][4].innerHTML="V é válido, mas a tag está diferente. Atualiza o bloco na linha onde estavam os endereços "+descricaoBloco+" e atualiza a tag.";
        } else if (acessoResultado=="F2") {
            enderecos[numEnderecoLeitura][3].innerHTML="FALTA";
            enderecos[numEnderecoLeitura][3].classList.add("falta");
            enderecos[numEnderecoLeitura][4].innerHTML="V não é válido. Carrega o bloco na próxima linha do conjunto.";
        } else if (acessoResultado=="F3") {
            enderecos[numEnderecoLeitura][3].innerHTML="FALTA";
            enderecos[numEnderecoLeitura][3].classList.add("falta");
            let descricaoBloco=blocosAnteriores[0].toString()+".."+blocosAnteriores[blocosAnteriores.length-1].toString();
            enderecos[numEnderecoLeitura][4].innerHTML="V é válido, mas a tag está diferente. Atualiza o bloco na linha onde estavam os endereços "+descricaoBloco+" através do método FIFO e atualiza a tag.";
        } else if (acessoResultado=="F4") {
            enderecos[numEnderecoLeitura][3].innerHTML="FALTA";
            enderecos[numEnderecoLeitura][3].classList.add("falta");
            let descricaoBloco=blocosAnteriores[0].toString()+".."+blocosAnteriores[blocosAnteriores.length-1].toString();
            enderecos[numEnderecoLeitura][4].innerHTML="V é válido, mas a tag está diferente. Atualiza o bloco na linha onde estavam os endereços "+descricaoBloco+" através do método LRU e atualiza a tag.";
        } else if (acessoResultado=="F5") {
            enderecos[numEnderecoLeitura][3].innerHTML="FALTA";
            enderecos[numEnderecoLeitura][3].classList.add("falta");
            let descricaoBloco=blocosAnteriores[0].toString()+".."+blocosAnteriores[blocosAnteriores.length-1].toString();
            enderecos[numEnderecoLeitura][4].innerHTML="V é válido, mas a tag está diferente. Atualiza o bloco na linha onde estavam os endereços "+descricaoBloco+" através do método RANDOM e atualiza a tag.";
        }
        enderecos[numEnderecoLeitura][1].parentElement.scrollIntoView({block:"center",inline:"center"});
        enderecoLendoBits=null;
        conjuntoLendo=null;
        blocoLendo=null;
        acessoResultado=null;
        numEnderecoLeitura++;
    }
}
function lerProximoEndereco() {
    if (numEnderecoLeitura>0) {
        enderecos[numEnderecoLeitura-1][1].parentElement.classList.remove("lendo");
    }
    if (numEnderecoLeitura<enderecos.length) {
        enderecos[numEnderecoLeitura][1].parentElement.classList.add("lendo");
        enderecos[numEnderecoLeitura][1].parentElement.scrollIntoView({block:"center",inline:"center"});
        enderecos[numEnderecoLeitura][3].innerHTML="Lendo...";
        enderecos[numEnderecoLeitura][4].innerHTML="";
        enderecoLendoBits=enderecos[numEnderecoLeitura][0].toString(2);
        while (enderecoLendoBits.length<bitsEndereco) {
            enderecoLendoBits="0"+enderecoLendoBits;
        }
    } else {
        pausarSimulacao();
    }
}
function lerConjunto() {
    if (conjuntoLendo==null) {
        conjuntoLendo=bin2dec(enderecoLendoBits.substring(bitsByteTag,bitsByteTag+bitsByteConjunto));
        conjuntos[conjuntoLendo].div_conjunto.classList.add("lendo");
        conjuntos[conjuntoLendo].div_conjunto.scrollIntoView({block:"center",inline:"center"});
        conjuntos[conjuntoLendo].atualizarUsosLinhas();
    }
}
function lerBloco() {
    if (blocoLendo==null) {
        blocoLendo=bin2dec(enderecoLendoBits.substring(bitsByteTag+bitsByteConjunto,bitsEndereco));
        linhaLeitura=false;
        for (let i=0; i<conjuntos[conjuntoLendo].linhas.length; i++) {
            if (conjuntos[conjuntoLendo].linhas[i].valido) {
                if (conjuntos[conjuntoLendo].linhas[i].tag!=enderecoLendoBits.substring(0,bitsByteTag)) {
                    conjuntos[conjuntoLendo].linhas[i].div_tag.classList.add("falta");
                } else {
                    conjuntos[conjuntoLendo].linhas[i].div_tag.classList.add("acerto");
                    conjuntos[conjuntoLendo].linhas[i].div_tag.scrollIntoView({block:"center",inline:"center"});
                    conjuntos[conjuntoLendo].linhas[i].linhaUso=0;
                    linhaLeitura=i;
                    break;
                }
            } else {
                conjuntos[conjuntoLendo].linhas[i].div_valido.classList.add("falta");
                conjuntos[conjuntoLendo].linhas[i].div_valido.scrollIntoView({block:"center",inline:"center"});
                linhaLeitura=i;
                break;
            }
        }
        if (linhaLeitura===false) {
            linhaLeitura=-1;
        }
    }
}
function resolverAcesso() {
    tagLendoBits=enderecoLendoBits.substring(0,bitsByteTag);
    if (acessoResultado==null) {
        if (linhaLeitura==-1) {
            var validador=0;
        } else {
            var validador=linhaLeitura;
        }
        if (!conjuntos[conjuntoLendo].linhas[validador].valido) {
            conjuntos[conjuntoLendo].proximaLinha().atualizarLinha(tagLendoBits,enderecos[numEnderecoLeitura][0]);
            acessoResultado="F2";
        } else {
            if (conjuntos[conjuntoLendo].linhas[validador].tag==tagLendoBits) {
                acessoResultado="A";
            } else {
                if (linhasConjunto==1) {
                    linhaLeitura=0;
                }
                if(linhaLeitura==-1) {
                    switch (select_defMetodoSubstituicao.value) {
                        case "FIFO": {
                            blocosAnteriores=[].concat(conjuntos[conjuntoLendo].proximaLinha().blocos);
                            conjuntos[conjuntoLendo].proximaLinha().atualizarLinha(tagLendoBits,enderecos[numEnderecoLeitura][0]);
                            acessoResultado="F3";
                        } break;
                        case "LRU": {
                            blocosAnteriores=[].concat(conjuntos[conjuntoLendo].linhaLRU().blocos);
                            conjuntos[conjuntoLendo].linhaLRU().atualizarLinha(tagLendoBits,enderecos[numEnderecoLeitura][0]);
                            acessoResultado="F4";
                        } break;
                        case "RANDOM": {
                            let linhaAleatoria=Math.floor(Math.random()*conjuntos[conjuntoLendo].linhas.length);
                            blocosAnteriores=[].concat(conjuntos[conjuntoLendo].linhas[linhaAleatoria].blocos);
                            conjuntos[conjuntoLendo].linhas[linhaAleatoria].atualizarLinha(tagLendoBits,enderecos[numEnderecoLeitura][0]);
                            acessoResultado="F5";
                        } break;
                    }
                } else {
                    blocosAnteriores=[].concat(conjuntos[conjuntoLendo].proximaLinha().blocos);
                    conjuntos[conjuntoLendo].proximaLinha().atualizarLinha(tagLendoBits,enderecos[numEnderecoLeitura][0]);
                    acessoResultado="F1";
                }
            }
        }
        conjuntos[conjuntoLendo].limparCSS();
    }
}
function bin2dec(bin) {
    let dec=0;
    for (let i=0; i<bin.length; i++) {
        dec+=parseInt(bin[i])*Math.pow(2,bin.length-i-1);
    }
    return dec;
}

function executarSimulacao() {
    atualizaVelocidade();
    if (numEnderecoLeitura>=enderecos.length) {
        resetarSimulacao();
    }
    if (execucaoSimulacao==null) {
        execucaoSimulacao=setInterval(executarProximaEtapa,tempoExecucao);
    }
}
function pausarSimulacao() {
    clearInterval(execucaoSimulacao);
    execucaoSimulacao=null;
}
function resetarSimulacao(argAtualizavel=true) {
    pausarSimulacao();
    if (argAtualizavel) {
        atualizaConfig();
        enderecoLendoBits=null;
        conjuntoLendo=null;
        blocoLendo=null;
        acessoResultado=null;
    }
}
function calcularTempoExecucao() {
    let tempo=parseInt(input_velocidade.value);
    span_velocidadeTexto.innerHTML=tempo;
    tempo=1000/tempo;
    return tempo;
}
function atualizaVelocidade() {
    tempoExecucao=calcularTempoExecucao();
    if (execucaoSimulacao!=null) {
        pausarSimulacao();
        executarSimulacao();
    }
}

//Ação!
atualizaConfig();
executarSimulacao();