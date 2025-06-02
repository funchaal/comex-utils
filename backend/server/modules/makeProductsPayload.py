from modules.utils import levenshtein
import pandas as pd

def makeProductsPayload(products, attributes_json):
    
    payload = []

    errors = []

    seq = 0

    for product in products:

        seq += 1

        ncm = product.get('ncm', '')
        descricao = product.get('descricao', '')
        denominacao = product.get('denominacao', '')
        raiz = product.get('raiz', '')
        situacao = product.get('situacao', 'ATIVADO')
        modalidade = product.get('modalidade', 'IMPORTACAO')
        codigointerno = product.get('codigoInterno')

        attribute_array = product['atributos']

        payload.append({
            'seq': seq, 
            'descricao': descricao, 
            'denominacao': denominacao, 
            'cpfCnpjRaiz': raiz, 
            'situacao': situacao, 
            'modalidade': modalidade, 
            'ncm': ncm, 
            'codigosInterno': [codigointerno], 
            'atributos': [], 
            'atributosCompostos': [], 
            'atributosMultivalorados': []
        })

        def proccess_row(atribute_brute, cond_attr=False, obrigatorio=True, base_attribute=None, sub_attr=False, multivalue_attr=False):

            atribute = None

            if cond_attr:
                atribute = atribute_brute['atributo']

                def get_logic_string(logic_string, condicao):
                    composicao = condicao.get('composicao', None)
                    operador = condicao['operador']
                    valor = condicao['valor']

                    # logic_string = f'"{base_attribute['valor']}" {operador} "{valor}"'
                    logic_string = '"' + str(base_attribute["valor"]) + '" ' + operador + ' "' + str(valor) + '"'

                    if composicao:
                        logic_string = f'({logic_string}) {str(composicao).replace('||', 'or')} '
                        get_logic_string(logic_string, condicao['condicao'])
                    else:
                        return logic_string
                    
                logic_string = get_logic_string('', atribute_brute['condicao'])

                if eval(f'not {logic_string}'):
                    return

            else:
                atribute = atribute_brute
            
            attr_code = atribute['codigo']
            attr_name = atribute['nomeApresentacao']
            attr_value = None

            # Verifica se tem subatributos
            if len(atribute['listaSubatributos']) > 0:

                payload[-1]['atributosCompostos'].append({
                    'atributo': attr_code, 
                    'valores': []
                })

                for sub_attr in atribute['listaSubatributos']:
                    proccess_row(sub_attr, obrigatorio=sub_attr['obrigatorio'], sub_attr=True)
                
                return

            # Pega o valor do atributo
            for attr in attribute_array:

                if attr['code'] == attr_code:
                    valid_value = (attr['value'] != '' and not pd.isna(attr['value']) and not attr['value'] == 'nan')
                    if valid_value and atribute.get('formaPreenchimento') in ('NUMERO_INTEIRO', 'LISTA_ESTATICA'):
                        try:
                            attr_value = str(int(attr['value']))
                        except ValueError:
                            errors.append({
                                'seq': seq, 
                                'atributo': attr_code, 
                                'ncm': ncm,
                                'nome': attr_name, 
                                'valor': attr['value'], 
                                'erro': 'Não foi possível converter o valor para inteiro.'
                            })
                            attr_value = str(attr['value']).strip()
                    else:
                        attr_value = str(attr['value']).strip()
                    break

            if attr_value == 'nan' or pd.isna(attr_value):
                attr_value = ''
            
            if not attr_value:
                if obrigatorio:
                    errors.append({
                        'seq': seq, 
                        'atributo': attr_code, 
                        'ncm': ncm,
                        'nome': attr_name, 
                        'valor': attr_value, 
                        'erro': 'Não foi possível associar um valor.'
                    })
                else:
                    return
                
            if attr_value.lower() == 'sim':
                attr_value = 'true'
            elif attr_value.lower().replace('ã', 'a') == 'nao':
                attr_value = 'false'
                
            if sub_attr:
                payload[-1]['atributosCompostos'][-1]['valores'].append({
                    'atributo': attr_code, 
                    'valor': attr_value
                })
            else:
                # Acrescenta o atributo ao payload
                if multivalue_attr:
                    attr_values = attr_value.split(',')
                    attr_values = [v.strip() for v in attr_values]

                    payload[-1]['atributosMultivalorados'].append({
                        'atributo': attr_code, 
                        'valores': attr_values
                    })
                else:
                    payload[-1]['atributos'].append({
                            'atributo': attr_code, 
                            'valor': attr_value
                        })
            
            if atribute['atributoCondicionante']:
                for atribute_cond in atribute['condicionados']:
                    proccess_row(atribute_cond, cond_attr=True, obrigatorio=atribute_cond['atributo']['obrigatorio'], sub_attr=sub_attr, multivalue_attr=atribute_cond['multivalorado'], base_attribute={ 'atributo': attr_code, 'valor': attr_value })
            


        ncm_dict = next((x for x in attributes_json['listaNcm'] if str(x['codigoNcm']).replace('.', '') == ncm), None)

        for attr in ncm_dict['listaAtributos']:

            # if attr['obrigatorio'] == False: 
            #     continue

            # if attr['codigo'] == 'ATT_11920':
            #     continue

            attr_dtls = next((d for d in attributes_json['detalhesAtributos'] if d['codigo'] == attr['codigo']), None)

            proccess_row(attr_dtls, obrigatorio=attr['obrigatorio'], multivalue_attr=attr['multivalorado'])

    return payload, errors